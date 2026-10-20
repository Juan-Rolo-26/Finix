import { BadRequestException } from '@nestjs/common';
export const FUNDAMENTAL_EXPANSION_TICKERS = 'AVGO ORCL CRM NOW INTU CSCO QCOM MU AMAT LRCX TXN ADI PANW CRWD SNPS CDNS SHOP SPOT COST HD LOW TGT SBUX PG CL UNH JNJ LLY ABBV MRK PFE AMGN ISRG TMO DHR ABT BAC C WFC GS MS MA AXP XOM CVX COP CAT DE GE HON'.split(' ');
const columns = ['name','description','logoid','sector','industry','exchange','country','close','change','market_cap_basic','price_earnings_ttm','price_sales_current','price_book_fq','price_free_cash_flow_ttm','enterprise_value_to_ebitda_ttm','dividend_yield_recent','earnings_per_share_diluted_ttm','total_revenue_ttm','gross_margin_ttm','operating_margin_ttm','net_margin_ttm','free_cash_flow_ttm','return_on_equity_fq','return_on_assets_fq','return_on_invested_capital_fq','total_debt_fq','net_debt_fq','current_ratio_fq','quick_ratio_fq','total_assets_fq','total_liabilities_fq','total_shares_outstanding_fundamental'];

export function observedFundamentalSnapshot(row: { s: string; d: any[] }, now = new Date()) {
    const data: Record<string, any> = Object.fromEntries(columns.map((key,index) => [key,row.d[index]]));
    const number = (key: string) => typeof data[key] === 'number' && Number.isFinite(data[key]) ? data[key] : null;
    if (!/^(NASDAQ|NYSE|AMEX):[A-Z0-9.-]+$/.test(row.s) || !data.name || !(number('close')! > 0) || !(number('market_cap_basic')! > 0)) throw new BadRequestException('No hay una ficha fundamental verificable para esta acción.');
    const ticker = String(data.name), name = String(data.description || ticker);
    const metrics: Record<string,number|null> = {};
    const mapping = { currentPrice:'close',dailyChange:'change',marketCap:'market_cap_basic',peRatio:'price_earnings_ttm',priceToSales:'price_sales_current',priceToBook:'price_book_fq',priceToFcf:'price_free_cash_flow_ttm',evToEbitda:'enterprise_value_to_ebitda_ttm',dividendYield:'dividend_yield_recent',eps:'earnings_per_share_diluted_ttm',revenue:'total_revenue_ttm',grossMargin:'gross_margin_ttm',operatingMargin:'operating_margin_ttm',netMargin:'net_margin_ttm',freeCashFlow:'free_cash_flow_ttm',roe:'return_on_equity_fq',roa:'return_on_assets_fq',roic:'return_on_invested_capital_fq',totalDebt:'total_debt_fq',netDebt:'net_debt_fq',currentRatio:'current_ratio_fq',quickRatio:'quick_ratio_fq',totalAssets:'total_assets_fq',totalLiabilities:'total_liabilities_fq',sharesOutstanding:'total_shares_outstanding_fundamental' };
    for (const [field,source] of Object.entries(mapping)) metrics[field] = number(source);
    if (metrics.totalAssets != null && metrics.totalLiabilities != null) metrics.equity = metrics.totalAssets - metrics.totalLiabilities;
    if (metrics.freeCashFlow != null && metrics.marketCap! > 0) metrics.fcfYield = metrics.freeCashFlow / metrics.marketCap! * 100;
    if (metrics.freeCashFlow != null && metrics.revenue! > 0) metrics.fcfMargin = metrics.freeCashFlow / metrics.revenue! * 100;
    const source = `https://www.tradingview.com/symbols/${row.s.replace(':','-')}/financials-overview/`;
    const summary = `${name} (${ticker}). Ficha fundamental con resultados de los últimos doce meses (TTM), balance del último trimestre informado y múltiplos disponibles en TradingView. Los campos sin información del proveedor se muestran como no disponibles; no se estiman valores razonables ni series históricas.`;
    return { symbol:row.s,ticker,slug:ticker.toLowerCase().replace(/[^a-z0-9]+/g,'-'),companyName:name,exchange:row.s.split(':')[0],sector:data.sector || null,industry:data.industry || null,country:data.country || null,logoUrl:`https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`,status:'PUBLISHED',isActive:true,analysisDate:now,...metrics,
        executiveSummary:{title:`Análisis fundamental de ${name}`,summary,positivePoints:[],negativePoints:[],conclusion:'Contrastá los datos y los períodos contables en la fuente original antes de elaborar una tesis de inversión.'},
        sectionVisibility:{showHeader:true,showSummary:true,showCompany:true,showBusinessModel:false,showGrowth:metrics.revenue!=null,showProfitability:metrics.eps!=null||metrics.netMargin!=null,showCashFlow:metrics.freeCashFlow!=null,showBalance:metrics.totalAssets!=null||metrics.totalDebt!=null,showValuation:true,showFairValue:false,showOwnership:metrics.sharesOutstanding!=null,showCompetitors:false,showTechnical:false,showRisks:false,showCatalysts:false,showScenarios:false,showConclusion:true},
        sources:`TradingView · datos fundamentales TTM / último trimestre. Consulta: ${now.toISOString().slice(0,10)}. ${source}`,legalDisclaimer:'Información educativa. Datos TTM y último trimestre según disponibilidad de la fuente. No constituye una recomendación de inversión.' };
}

export async function fetchObservedFundamentals(tickers: string[]) {
    const clean = [...new Set(tickers.map(ticker => ticker.toUpperCase()))];
    if (clean.length > 80 || clean.some(ticker => !/^[A-Z0-9.-]{1,12}$/.test(ticker))) throw new BadRequestException('Lista de acciones inválida.');
    const response = await fetch('https://scanner.tradingview.com/america/scan', { method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0 Finix'},body:JSON.stringify({symbols:{tickers:clean.flatMap(ticker=>['NASDAQ:'+ticker,'NYSE:'+ticker,'AMEX:'+ticker])},columns}),signal:AbortSignal.timeout(15000) });
    if (!response.ok) throw new BadRequestException('El proveedor no pudo verificar las fichas fundamentales.');
    const payload = await response.json();
    const rows = new Map<string, any>();
    for (const row of payload?.data || []) {
        if (!Array.isArray(row.d)) continue;
        try { const snapshot = observedFundamentalSnapshot(row); if (clean.includes(snapshot.ticker) && !rows.has(snapshot.ticker)) rows.set(snapshot.ticker,snapshot); } catch { /* Missing provider data is never filled with invented metrics. */ }
    }
    return rows;
}
