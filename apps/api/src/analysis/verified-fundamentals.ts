/** Observed provider values and SEC facts only. Unknown fields remain null. */
export type FundamentalInputs = { ticker: string; profile?: any; finnhubProfile?: any; finnhub?: any; sec?: any; ratios?: any; keyMetrics?: any; estimates?: any[]; segments?: any[]; geography?: any[]; queriedAt?: string; reported?: any };
const num = (v: any): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const first = (...v: any[]) => v.map(num).find(x => x !== null) ?? null;
const percent = (n: number | null, d: number | null) => n !== null && d !== null && d !== 0 ? n / d * 100 : null;
const sectorNames: Record<string,string> = { Technology:'Tecnología', 'Information Technology':'Tecnología', Healthcare:'Salud', 'Health Care':'Salud', Financials:'Finanzas', 'Financial Services':'Finanzas', 'Consumer Cyclical':'Consumo discrecional', 'Consumer Defensive':'Consumo básico', 'Consumer Staples':'Consumo básico', Industrials:'Industria', 'Communication Services':'Comunicaciones', Energy:'Energía', 'Real Estate':'Inmuebles', 'Basic Materials':'Materiales', Utilities:'Servicios públicos' };
export function buildVerifiedFundamentals(input: FundamentalInputs) {
    const { ticker } = input, p = input.profile || {}, fp = input.finnhubProfile || {}, m = input.finnhub?.metric || {}, r = input.ratios || {}, k = input.keyMetrics || {};
    const observedAt = input.queriedAt || new Date().toISOString(), today = observedAt.slice(0,10);
    const gaap = structuredClone(input.sec?.facts?.['us-gaap'] || input.sec?.facts?.['ifrs-full'] || {});
    // Finnhub supplies standardized line items from actual issuer annual filings. Supplement missing SEC histories.
    for (const report of input.reported?.data || []) {
        if (!report.form || !report.startDate || !report.endDate || !report.filedDate) continue;
        for (const row of [...(report.report?.ic || []), ...(report.report?.bs || []), ...(report.report?.cf || [])]) {
            if (!row.concept?.startsWith('us-gaap_') || num(row.value) === null || !/^(usd|cny|cad|eur|jpy|gbp)$/i.test(row.unit || '')) continue;
            const name = row.concept.slice('us-gaap_'.length), unit = row.unit.toUpperCase();
            if (!gaap[name]) gaap[name] = { units: {} };
            if (!gaap[name].units[unit]) gaap[name].units[unit] = [];
            const instant = (report.report?.bs || []).includes(row);
            gaap[name].units[unit].push({ ...(instant ? {} : { start: report.startDate.slice(0,10) }), end: report.endDate.slice(0,10), filed: report.filedDate.slice(0,10), val: row.value, form: report.form });
        }
    }
    const incomeTags = ['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','Revenue','RevenueFromContractWithCustomerIncludingAssessedTax','RevenuesNetOfInterestExpense'];
    const valid = (x: any) => x.end <= today && x.filed <= today && /^(10-K|10-Q|20-F|40-F|6-K)(\/A)?$/.test(x.form) && num(x.val) !== null;
    const duration = (x: any) => x.start ? (Date.parse(x.end)-Date.parse(x.start))/86400000+1 : 0;
    // Prefer issuer-published USD values. Never label native-currency values as USD.
    const revenueUnits = incomeTags.flatMap(tag => Object.keys(gaap[tag]?.units || {}));
    const financialCurrency = revenueUnits.includes('USD') ? 'USD' : revenueUnits.find(x => /^[A-Z]{3}$/.test(x)) || 'USD';
    function facts(tags: string[], kind: 'instant'|'annual'|'flow', currency = financialCurrency): any[] {
        const candidates = tags.map(tag => ({ tag, rows: (gaap[tag]?.units?.[currency] || []).filter(valid).filter((x: any) => kind === 'instant' ? !x.start : kind === 'annual' ? duration(x) >= 320 && duration(x) <= 385 : duration(x) >= 60 && duration(x) <= 385) })).filter(x => x.rows.length);
        if (!candidates.length) return [];
        candidates.sort((a,b) => b.rows.map(x=>x.end).sort().at(-1)!.localeCompare(a.rows.map(x=>x.end).sort().at(-1)!));
        const rows = candidates[0].rows.sort((a,b) => b.end.localeCompare(a.end) || b.filed.localeCompare(a.filed));
        const seen = new Set<string>();
        return rows.filter(x => { const key = x.start + ':' + x.end; if (seen.has(key)) return false; seen.add(key); return true; });
    }
    const instant = (tags: string[]) => facts(tags, 'instant')[0];
    const currentBalance = instant(['Assets','AssetsCurrent'])?.end || null;
    const balance = (tags: string[]) => { const x=instant(tags); return x && x.end === currentBalance ? num(x.val) : null; };
    function trailing(tags: string[]) {
        const annual = facts(tags,'annual')[0]; if (!annual) return null;
        const interim = facts(tags,'flow').filter(x => x.end > annual.end && duration(x) < 320).sort((a,b) => b.end.localeCompare(a.end) || duration(b)-duration(a))[0];
        if (!interim) return { value: annual.val as number, end: annual.end, basis: 'FY' };
        const prior = facts(tags,'flow').filter(x => Math.abs((Date.parse(interim.start)-Date.parse(x.start))/86400000 - 365) < 12 && Math.abs(duration(x)-duration(interim)) < 12).sort((a,b)=>b.end.localeCompare(a.end))[0];
        if (!prior) return { value: annual.val as number, end: annual.end, basis: 'FY' };
        return { value: annual.val + interim.val - prior.val, end: interim.end, basis: 'TTM' };
    }
    const rev = trailing(incomeTags), profit = trailing(['NetIncomeLoss','ProfitLoss']), op = trailing(['OperatingIncomeLoss','ProfitLossFromOperatingActivities']);
    const cf = trailing(['NetCashProvidedByUsedInOperatingActivities','CashFlowsFromUsedInOperatingActivities']);
    const cap = trailing(['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets','PaymentsToAcquireOtherPropertyPlantAndEquipment','PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities']);
    const depreciation = trailing(['DepreciationDepletionAndAmortization','DepreciationDepletionAndAmortizationPropertyPlantAndEquipment','DepreciationAndAmortization']);
    const aligned = (value: any, base: any = rev) => value && base && value.end === base.end && value.basis === base.basis ? num(value.value) : null;
    const debtLong = balance(['LongTermDebtNoncurrent','LongTermDebt']), debtCurrentLong=balance(['LongTermDebtCurrent']);
    const borrowings=balance(['ShortTermBorrowings','CommercialPaper']);
    const debtShort=debtCurrentLong !== null || borrowings !== null ? (debtCurrentLong || 0)+(borrowings || 0) : null;
    const totalDebt=debtLong !== null && debtShort !== null ? debtLong+debtShort : null;
    const cash=balance(['CashAndCashEquivalentsAtCarryingValue','CashAndCashEquivalents','CashCashEquivalentsAndFederalFundsSold']);
    const assets=balance(['Assets']), equity=balance(['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest','StockholdersEquity','Equity']);
    const liab=first(balance(['Liabilities']),assets!==null&&equity!==null?assets-equity:null);
    const revenue=rev?.value ?? null, operatingCashFlow=num(cf?.value), capEx=aligned(cap,cf);
    const fcf=operatingCashFlow!==null&&capEx!==null?operatingCashFlow-Math.abs(capEx):null;
    const netIncome=aligned(profit), ebit=aligned(op), da=aligned(depreciation);
    const sharesFact=(input.sec?.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares||[]).filter(valid).sort((a:any,b:any)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed))[0];
    const data: Record<string,any> = {
        ticker, symbol: (p.exchangeShortName || (fp.exchange?.includes('NEW YORK')?'NYSE':'NASDAQ')) + ':' + ticker,
        companyName:p.companyName || fp.name || input.sec?.entityName || ticker,
        sector:sectorNames[p.sector] || p.sector || fp.finnhubIndustry || null, industry:p.industry || fp.finnhubIndustry || null,
        country:p.country || fp.country || null, ceo:p.ceo || null, employeesCount:p.fullTimeEmployees ? parseInt(p.fullTimeEmployees,10) : null,
        foundedYear:null, exchange:p.exchangeShortName || null, logoUrl:p.image || fp.logo || null,
        marketCap:first(p.marketCap,num(m.marketCapitalization)!==null?m.marketCapitalization*1e6:null), currentPrice:num(p.price),
        revenue, revenueGrowthYoY:num(m.revenueGrowthTTMYoy), revenueCagr3y:num(m.revenueGrowth3Y), revenueCagr5y:num(m.revenueGrowth5Y),
        eps:first(m.epsTTM,m.epsInclExtraItemsTTM), epsGrowth:num(m.epsGrowthTTMYoy),
        grossMargin:first(m.grossMarginTTM,num(r.grossProfitMarginTTM)!==null?r.grossProfitMarginTTM*100:null),
        operatingMargin:first(m.operatingMarginTTM,percent(ebit,revenue)), netMargin:first(m.netProfitMarginTTM,percent(netIncome,revenue)),
        ebit, ebitda:ebit!==null&&da!==null?ebit+da:null, ebitdaMargin:null,
        roe:first(m.roeTTM,num(k.returnOnEquityTTM)!==null?k.returnOnEquityTTM*100:null),
        roa:first(m.roaTTM,num(k.returnOnAssetsTTM)!==null?k.returnOnAssetsTTM*100:null),
        roic:num(k.returnOnInvestedCapitalTTM)!==null?k.returnOnInvestedCapitalTTM*100:null,
        roce:num(k.returnOnCapitalEmployedTTM)!==null?k.returnOnCapitalEmployedTTM*100:null,
        peRatio:first(m.peTTM,r.priceToEarningsRatioTTM), forwardPe:num(m.forwardPE), pegRatio:first(m.pegTTM,r.priceToEarningsGrowthRatioTTM),
        priceToSales:first(m.psTTM,r.priceToSalesRatioTTM), priceToBook:first(m.pb,r.priceToBookRatioTTM),
        evToEbitda:first(m.evEbitdaTTM,k.evToEBITDATTM), evToRevenue:first(m.evRevenueTTM,k.evToSalesTTM), priceToFcf:first(m.pfcfShareTTM,r.priceToFreeCashFlowRatioTTM),
        dividendYield:first(m.currentDividendYieldTTM,num(r.dividendYieldTTM)!==null?r.dividendYieldTTM*100:null),
        cash,totalDebt,longTermDebt:debtLong,shortTermDebt:debtShort,netDebt:totalDebt!==null&&cash!==null?totalDebt-cash:null,
        netDebtToEbitda:num(k.netDebtToEBITDATTM),currentRatio:first(m.currentRatioQuarterly,r.currentRatioTTM),quickRatio:first(m.quickRatioQuarterly,r.quickRatioTTM),
        totalAssets:assets,totalLiabilities:liab,equity,interestPaid:aligned(trailing(['InterestPaidNet','InterestPaid'])),interestCoverageRatio:num(m.netInterestCoverageTTM),
        operatingCashFlow,capEx:capEx!==null?Math.abs(capEx):null,freeCashFlow:fcf,fcfMargin:cf?.end===rev?.end&&cf?.basis===rev?.basis?percent(fcf,revenue):null,
        fcfPerShare:num(r.freeCashFlowPerShareTTM),fcfYield:num(m.pfcfShareTTM)!==null&&m.pfcfShareTTM!==0?100/m.pfcfShareTTM:null,
        earningsToCashConversion:operatingCashFlow!==null&&netIncome!==null&&netIncome!==0?operatingCashFlow/netIncome:null,
        sharesOutstanding:first(sharesFact?.val,num(fp.shareOutstanding)!==null?fp.shareOutstanding*1e6:null),beta:num(m.beta),
        high52w:num(m['52WeekHigh']),low52w:num(m['52WeekLow']),yearlyChange:num(m['52WeekPriceReturnDaily']),
        weeklyChange:num(m['5DayPriceReturnDaily']),monthlyChange:null,dailyChange:num(p.changePercentage),
        historicalAvgPe:null,sectorPe:null,competitorsPe:null,estimatedFairValue:null,valuationPremiumDiscount:null,
        arr:null,mrr:null,shareDilution:null,insiderOwnership:null,institutionalOwnership:null,shortInterest:null,shortFloat:null,fcfGrowth:null,equityGrowth:null,
        revenueGuidance:null,realVsEstimatedRevenue:null,epsEstimatedVsReal:null,recurringRevenue:null,
        insiderBuys:null,insiderSells:null,buybacks:null,sharesGrowthReduction:null,
        mainCompetitors:null,competitiveAdvantage:null,customerDependency:null,productDependency:null,marketShare:null,
        technicalData:{},competitorsData:[],scenariosData:null,swotData:null,segmentGrowth:[],
        analysisDate:observedAt,
    };
    // ADR/share counts cannot be combined with issuer EPS or per-share cash flows without a verified ADR ratio.
    if (p.isAdr || (p.country && p.country !== 'US' && /ADR|ADS/i.test(p.companyName || ''))) data.fcfPerShare=null;
    data.ebitdaMargin=percent(data.ebitda,revenue);
    data.marketCapToFcf=data.priceToFcf;
    const annualRevenues=facts(incomeTags,'annual').filter((x,i,all)=>all.findIndex(y=>y.end===x.end)===i).slice(0,8).reverse();
    const latestFY=annualRevenues.at(-1), cagr=(years:number)=>{const old=annualRevenues.find(x=>Math.abs((Date.parse(latestFY?.end)-Date.parse(x.end))/86400000-years*365)<20);return old&&latestFY?.val>0&&old.val>0?(Math.pow(latestFY.val/old.val,1/years)-1)*100:null;};
    data.revenueCagr3y=first(cagr(3),data.revenueCagr3y);data.revenueCagr5y=first(cagr(5),data.revenueCagr5y);
    const annualProfits=facts(['NetIncomeLoss','ProfitLoss'],'annual');
    const annualOps=facts(['OperatingIncomeLoss','ProfitLossFromOperatingActivities'],'annual');
    const annualGross=facts(['GrossProfit'],'annual');
    const periods={revenue:rev?.end,balance:currentBalance,cashFlow:cf?.end,cashFlowBasis:cf?.basis,basis:rev?.basis,currency:financialCurrency,queriedAt:observedAt};
    data.historicalSeries={meta:periods,revenue:annualRevenues.map(x=>({period:x.end,value:x.val/1e6})),margins:annualRevenues.map(x=>({period:x.end,grossMargin:percent(annualGross.find(v=>v.end===x.end)?.val??null,x.val),operatingMargin:percent(annualOps.find(v=>v.end===x.end)?.val??null,x.val),netMargin:percent(annualProfits.find(v=>v.end===x.end)?.val??null,x.val)}))};
    const money=(v:number|null)=>v===null?'no informado':new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(v/1e6)+' millones '+financialCurrency;
    const pct=(v:number|null)=>v===null?'no informado':new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(v)+'%';
    data.businessDescription=`${data.companyName} pertenece al sector ${data.sector || 'no informado'}. Esta ficha reúne cifras publicadas y métricas observadas; los importes contables están expresados en ${financialCurrency}. Los precios y la capitalización corresponden a la cotización en USD.`;
    const seg=(input.segments||[]).filter(x=>x.date<=today&&x.period==='FY'&&x.reportedCurrency===financialCurrency).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const geo=(input.geography||[]).filter(x=>x.date<=today&&x.period==='FY'&&x.reportedCurrency===financialCurrency).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const segments=Object.entries(seg?.data||{}).filter(([,v])=>num(v)!==null&&Number(v)>=0) as [string,number][];
    // Do not infer segment percentages when totals contain overlapping segment/subsegment disclosures.
    data.businessModel=segments.map(([product,value])=>({product,description:`Ingresos publicados del ejercicio cerrado el ${seg.date}: ${money(value)}. Fuente: desglose reportado por la compañía.`}));
    data.mainRevenueSources=segments.length?segments.map(([name,value])=>name+': '+money(value)).join('; '):null;
    data.businessSegments=segments.length?segments.map(([name])=>name).join(', '):null;
    data.geographicRevenue=geo?Object.entries(geo.data||{}).map(([name,value])=>name+': '+money(num(value))).join('; '):null;
    data.productsServices=null;data.revenueGeneration=null;data.growthBySegment=null;data.growthByRegion=null;
    const estimate=(input.estimates||[]).filter(x=>x.date>today&&num(x.revenueAvg)!==null).sort((a,b)=>a.date.localeCompare(b.date))[0];
    data.estimatedRevenue=financialCurrency==='USD'&&p.currency==='USD'&&!p.isAdr?num(estimate?.revenueAvg):null;
    const positive:string[]=[],negative:string[]=[];
    if(data.revenueGrowthYoY!==null)(data.revenueGrowthYoY>=0?positive:negative).push(`Crecimiento interanual de ingresos TTM: ${pct(data.revenueGrowthYoY)}.`);
    if(data.netMargin!==null)(data.netMargin>=0?positive:negative).push(`Margen neto TTM: ${pct(data.netMargin)}.`);
    if(fcf!==null)(fcf>=0?positive:negative).push(`Flujo de caja libre ${cf?.basis || ''} al ${cf?.end || 'período no informado'}: ${money(fcf)}.`);
    if(data.netDebt!==null)(data.netDebt<=0?positive:negative).push(`Deuda neta en el balance del ${currentBalance}: ${money(data.netDebt)}.`);
    data.executiveSummary={title:`${data.companyName}: lectura fundamental basada en datos publicados`,summary:`Ingresos ${rev?.basis || ''} al ${rev?.end || 'período no informado'}: ${money(revenue)}. Rentabilidad neta: ${pct(data.netMargin)}. P/E observado: ${data.peRatio!==null?data.peRatio.toFixed(2)+' veces':'no informado'}. ${data.forwardPe!==null?'P/E futuro del proveedor: '+data.forwardPe.toFixed(2)+' veces. ':''}Las estimaciones de analistas se diferencian de las cifras reportadas; no se calcula un precio objetivo sin un modelo documentado.`,positivePoints:positive,negativePoints:negative};
    data.risksData=[{title:'Rentabilidad y conversión en caja',description:`Margen neto: ${pct(data.netMargin)}. Caja operativa: ${money(operatingCashFlow)}. Comparar crecimiento con generación de caja y gastos de capital.`,severity:'MONITORING'},{title:'Solvencia y refinanciación',description:`Deuda total: ${money(totalDebt)}; efectivo: ${money(cash)}. Las métricas de deuda y flujo de caja requieren una lectura distinta en entidades financieras.`,severity:'MONITORING'}];
    data.catalystsData=[];
    data.valuationMethodology={description:'Múltiplos observados del proveedor y cifras publicadas. El P/E futuro y el consenso de ingresos son estimaciones, no guidance de la compañía. No se generan valores razonables, descuentos, competidores, accionistas ni escenarios con supuestos automáticos.'};
    data.historicalCashFlow=`Caja operativa: ${money(operatingCashFlow)}; CapEx: ${money(data.capEx)}; FCF: ${money(fcf)}. Período: ${cf?.end || 'no informado'}.`;
    data.historicalValuation=null;
    data.sources=`${input.sec?.cik ? 'SEC Company Facts: https://data.sec.gov/api/xbrl/companyfacts/CIK'+String(input.sec.cik).padStart(10,'0')+'.json · ' : ''}Métricas Finnhub: https://finnhub.io/docs/api/basic-financials · Perfil/desglose FMP: https://site.financialmodelingprep.com/developer/docs · Consultado: ${observedAt}. Ingresos ${rev?.basis || 'no informado'}: ${rev?.end || 'no informado'}; balance: ${currentBalance || 'no informado'}; moneda contable: ${financialCurrency}.`;
    data.legalDisclaimer='Información educativa basada en datos publicados. Un campo no informado no equivale a cero. Las entidades financieras pueden no publicar ratios operativos comparables; las estimaciones no constituyen asesoramiento ni recomendación de inversión.';
    data.sectionVisibility={showSummary:true,showCompany:true,showBusinessModel:true,showGrowth:true,showProfitability:true,showValuation:true,showFairValue:false,showBalance:true,showCashFlow:true,showOwnership:true,showRisks:true,showTechnical:false,showCompetitors:false,showScenarios:false,showSwot:false};
    return data;
}

let secTickerCache: { at:number; data:any } | undefined;
export async function fetchVerifiedFundamentals(symbol: string) {
    const ticker=symbol.trim().toUpperCase().split(':').at(-1)!;
    if(!/^[A-Z0-9.-]{1,16}$/.test(ticker)) throw new Error('Ticker inválido.');
    const read=async(url:string)=>{try{const response=await fetch(url,{headers:{'User-Agent':'Finix Research contact@finixarg.com'},signal:AbortSignal.timeout(12000)});return response.ok?await response.json():null;}catch{return null;}};
    const token=encodeURIComponent(process.env.FINNHUB_API_KEY||'');
    const [finnhub,finnhubProfile,reported,quote]=await Promise.all([read('https://finnhub.io/api/v1/stock/metric?symbol='+ticker+'&metric=all&token='+token),read('https://finnhub.io/api/v1/stock/profile2?symbol='+ticker+'&token='+token),read('https://finnhub.io/api/v1/stock/financials-reported?symbol='+ticker+'&freq=annual&token='+token),read('https://finnhub.io/api/v1/quote?symbol='+ticker+'&token='+token)]);
    if(!finnhub?.metric||!Object.keys(finnhub.metric).length)throw new Error('El proveedor no devolvió métricas verificables. Reintentá sin guardar valores de ejemplo.');
    if(!secTickerCache||Date.now()-secTickerCache.at>86400000){const data=await read('https://www.sec.gov/files/company_tickers.json');if(data)secTickerCache={at:Date.now(),data};}
    const issuer=Object.values(secTickerCache?.data||{}).find((x:any)=>x.ticker===ticker) as any;
    const sec=issuer?await read('https://data.sec.gov/api/xbrl/companyfacts/CIK'+String(issuer.cik_str).padStart(10,'0')+'.json'):null;
    return buildVerifiedFundamentals({ticker,profile:{price:quote?.c>0?quote.c:null,changePercentage:quote?.dp},finnhubProfile,finnhub,sec,reported});
}
