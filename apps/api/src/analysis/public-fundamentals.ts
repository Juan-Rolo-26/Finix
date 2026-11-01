import { load } from 'cheerio';

type PageName = 'statistics' | 'ratios' | 'company' | 'income' | 'balance' | 'cashFlow' | 'forecast';
export type PublicPages = Partial<Record<PageName, string>>;
export type FieldEvidence = { source: string; queriedAt: string; period?: string; currency?: string; basis?: string; method?: string };
const paths: Record<PageName,string> = { statistics:'statistics/',ratios:'financials/ratios/',company:'company/',income:'financials/',balance:'financials/balance-sheet/',cashFlow:'financials/cash-flow-statement/',forecast:'forecast/' };
export function observedNumber(raw: string | undefined, scale = 1): number | null {
    if (!raw) return null;
    const text = raw.replace(/\u2212/g,'-').replace(/[$,%\s,]/g,'').trim();
    const match = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))([TBMK])?$/i);
    if (!match) return null;
    const suffix: Record<string,number> = {T:1e12,B:1e9,M:1e6,K:1e3};
    const value = Number(match[1]) * (match[2] ? suffix[match[2].toUpperCase()] : scale);
    return Number.isFinite(value) ? value : null;
}
const plain = (value: string) => value.replace(/\s+/g,' ').trim();
function tables(html = '') {
    const $ = load(html);
    const result = $('table').toArray().map(table => $(table).find('tr').toArray().map(row => $(row).find('th,td').toArray().map(cell => $(cell).text().trim())));
    return { $, tables: result };
}
function rowMap(rows: string[][]) {
    const map = new Map<string,string[]>();
    for (const row of rows) { const key = plain((row[0] || '').split(/\s{2,}/)[0]); if (key && !map.has(key)) map.set(key,row.slice(1).map(plain)); }
    return map;
}
function fiscal(html = '') {
    const parsed = tables(html), all = parsed.tables.flat(), map = rowMap(all), headers = map.get('Fiscal Year') || [];
    const currency = parsed.$('main').text().match(/(?:Millions|Billions|Thousands)\s*(USD|CNY|CAD|EUR|GBP|JPY)/i)?.[1]?.toUpperCase();
    const scale = /Billions\s*(USD|CNY|CAD|EUR|GBP|JPY)/i.test(parsed.$('main').text()) ? 1e9 : /Thousands\s*(USD|CNY|CAD|EUR|GBP|JPY)/i.test(parsed.$('main').text()) ? 1e3 : currency ? 1e6 : null;
    const dates = (map.get('Period Ending') || []).map(raw => { const match = raw.match(/([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})/); if (!match) return null; const time = Date.parse(match[0] + ' 00:00:00 GMT'); return Number.isFinite(time) ? new Date(time).toISOString().slice(0,10) : null; });
    return { ...parsed, map, headers, dates, currency, scale };
}
const sectorNames: Record<string,string> = { Technology:'Tecnología', 'Healthcare':'Salud', 'Financials':'Finanzas', 'Financial Services':'Finanzas', 'Consumer Cyclical':'Consumo discrecional', 'Consumer Discretionary':'Consumo discrecional', 'Consumer Defensive':'Consumo básico', 'Consumer Staples':'Consumo básico', Industrials:'Industria', 'Communication Services':'Comunicaciones', Energy:'Energía', 'Real Estate':'Inmuebles', 'Basic Materials':'Materiales', Materials:'Materiales', Utilities:'Servicios públicos' };
export function parsePublicFundamentals(ticker: string, pages: PublicPages, queriedAt = new Date().toISOString()) {
    const clean = ticker.toUpperCase(), source = (page: PageName) => 'https://stockanalysis.com/stocks/' + clean.toLowerCase() + '/' + paths[page];
    const values: Record<string,any> = {}, evidence: Record<string,FieldEvidence> = {}, unavailable: Record<string,string> = {};
    const stats = tables(pages.statistics), company = tables(pages.company), ratios = fiscal(pages.ratios), income = fiscal(pages.income), balance = fiscal(pages.balance), cash = fiscal(pages.cashFlow), forecast = fiscal(pages.forecast);
    // Reject a valid-looking response for a different security, an error page or a login page.
    for (const name of Object.keys(pages) as PageName[]) {
        const $ = load(pages[name]!); const title = $('title').text();
        if (!title.includes('(' + clean + ')')) throw new Error('La fuente no coincide con la acción solicitada.');
    }
    const sm = rowMap(stats.tables.flat()), cm = rowMap(company.tables.flat());
    const put = (field: string, value: any, page: PageName, details: Partial<FieldEvidence> = {}) => { if (value === null || value === undefined || value === '' || typeof value === 'number' && !Number.isFinite(value)) return; values[field] = value; evidence[field] = {source:source(page),queriedAt,...details}; };
    const numeric: Record<string,string> = { insiderOwnership:'Owned by Insiders (%)',institutionalOwnership:'Owned by Institutions (%)',shortInterest:'Short Interest',shortFloat:'Short % of Float',shareDilution:'Shares Change (YoY)',peRatio:'PE Ratio',forwardPe:'Forward PE',pegRatio:'PEG Ratio',priceToSales:'PS Ratio',priceToBook:'PB Ratio',priceToFcf:'P/FCF Ratio',evToRevenue:'EV / Sales',evToEbitda:'EV / EBITDA',roe:'Return on Equity (ROE)',roa:'Return on Assets (ROA)',roic:'Return on Invested Capital (ROIC)',roce:'Return on Capital Employed (ROCE)',currentRatio:'Current Ratio',quickRatio:'Quick Ratio',interestCoverageRatio:'Interest Coverage',grossMargin:'Gross Margin',operatingMargin:'Operating Margin',netMargin:'Profit Margin',ebitdaMargin:'EBITDA Margin',fcfMargin:'FCF Margin',dividendYield:'Dividend Yield',fcfYield:'FCF Yield',beta:'Beta (5Y)' };
    for (const [field,label] of Object.entries(numeric)) put(field,observedNumber(sm.get(label)?.[0]),'statistics');
    if (/does not (?:currently )?(?:appear to )?pay (?:a|any) dividends?/i.test(stats.$('main').text())) put('dividendYield',0,'statistics',{method:'La fuente declara que no paga dividendos.'});
    put('foundedYear',observedNumber(cm.get('Founded')?.[0]),'company'); put('employeesCount',observedNumber(cm.get('Employees')?.[0]),'company');
    const leaders = company.tables.flat().filter(row => /Chief Executive Officer/i.test(row[1] || '') && !/former|deputy|Chief Executive Officer of /i.test(row[1] || '')).map(row=>plain(row[0]));
    put('ceo',leaders.length ? [...new Set(leaders)].join(' / ') : cm.get('CEO')?.[0],'company');
    put('sector',sectorNames[cm.get('Sector')?.[0] || ''] || cm.get('Sector')?.[0],'company'); put('industry',cm.get('Industry')?.[0],'company');
    const pe = ratios.map.get('PE Ratio') || [];
    const peHistory = ratios.headers.map((header,index)=>({period:ratios.dates[index],value:observedNumber(pe[index]),header})).filter(x=>/^FY\s+\d{4}$/.test(x.header)&&x.period&&x.period<=queriedAt.slice(0,10)&&x.value!==null&&x.value>0).slice(0,5);
    if (peHistory.length >= 2) put('historicalAvgPe',peHistory.reduce((n,x)=>n+x.value!,0)/peHistory.length,'ratios',{method:'Media aritmética de '+peHistory.length+' P/E anuales positivos al cierre fiscal; excluye el dato corriente.'});
    else if (pages.ratios) unavailable.historicalAvgPe = 'No hay al menos dos ejercicios con P/E positivo; una media de años con pérdidas no permite comparar la valuación.';
    const psRow=ratios.map.get('PS Ratio')||[];const psHistory=ratios.headers.map((header,index)=>({period:ratios.dates[index],value:observedNumber(psRow[index]),header})).filter(x=>/^FY\s+\d{4}$/.test(x.header)&&x.period&&x.period<=queriedAt.slice(0,10)&&x.value!==null&&x.value>0).slice(0,5);
    const netDebtRatio = observedNumber(ratios.map.get('Net Debt / EBITDA Ratio')?.[0]); put('netDebtToEbitda',netDebtRatio,'ratios',{period:income.dates[0] || undefined,basis:'TTM'});
    const reportCurrency = cm.get('Reporting Currency')?.[0] || income.currency || null;
    if(reportCurrency==='USD')put('eps',observedNumber(sm.get('Earnings Per Share (EPS)')?.[0]),'statistics',{currency:'USD',period:income.dates[0]||undefined,basis:'TTM'});
    const floatShares=observedNumber(sm.get('Float')?.[0]);if(values.shortFloat===undefined&&floatShares!==null&&floatShares>0&&values.shortInterest!==undefined)put('shortFloat',values.shortInterest/floatShares*100,'statistics',{method:'Acciones vendidas en corto / float reportado × 100.'});
    const monetary = (field: string, page: PageName, label: string, book: ReturnType<typeof fiscal>, absolute = false) => {
        const n = observedNumber(book.map.get(label)?.[0],book.scale || 1); if (!book.scale || !book.currency || !book.dates[0] || book.dates[0]!>queriedAt.slice(0,10)) return;
        put(field,n===null?null:absolute?Math.abs(n):n,page,{currency:book.currency,period:book.dates[0]!,basis:book.headers[0]==='TTM'?'TTM':'FY'});
    };
    for (const [field,label] of Object.entries({cash:'Cash & Equivalents',totalDebt:'Total Debt',longTermDebt:'Long-Term Debt',totalAssets:'Total Assets',totalLiabilities:'Total Liabilities',equity:"Shareholders' Equity"})) monetary(field,'balance',label,balance);
    for (const [field,label] of Object.entries({operatingCashFlow:'Operating Cash Flow',capEx:'Capital Expenditures',freeCashFlow:'Free Cash Flow',interestPaid:'Cash Interest Paid'})) monetary(field,'cashFlow',label,cash,field==='capEx');
    // Some issuers publish net cash and cash plus investments instead of a gross debt row.
    if(values.totalDebt===undefined&&balance.currency&&balance.scale&&balance.dates[0]){
        const liquid=observedNumber(balance.map.get('Cash & Short-Term Investments')?.[0],balance.scale),net=observedNumber(balance.map.get('Net Cash (Debt)')?.[0],balance.scale);
        if(liquid!==null&&net!==null&&liquid>=net)put('totalDebt',liquid-net,'balance',{currency:balance.currency,period:balance.dates[0]!,method:'Identidad de la tabla publicada: efectivo e inversiones de corto plazo menos posición neta de caja. Una deuda nula se calcula solo si ambas cifras son iguales.'});
    }
    // Per-share cash-flow amounts are already currency/share; do not multiply by a table's millions scale.
    const fcfPerShare = observedNumber(cash.map.get('Free Cash Flow Per Share')?.[0]); if(cash.currency && cash.dates[0]) put('fcfPerShare',fcfPerShare,'cashFlow',{currency:cash.currency,period:cash.dates[0]!,basis:cash.headers[0]==='TTM'?'TTM':'FY'});
    for(const [field,label]of Object.entries({ebit:'Operating Income',ebitda:'EBITDA'})) {
        const v=observedNumber(sm.get(label)?.[0]);
        // Statistics are USD-denominated market summaries. Only use amounts for USD reporters.
        if(reportCurrency==='USD')put(field,v,'statistics',{currency:'USD',period:income.dates[0]||undefined,basis:'TTM'});
    }
    const equityValues=balance.map.get("Shareholders' Equity")||[];
    const annualIndexes=balance.headers.map((h,i)=>/^FY\s+\d{4}$/.test(h)?i:-1).filter(i=>i>=0&&balance.dates[i]!<=queriedAt.slice(0,10));
    if(annualIndexes.length>=2){const [a,b]=annualIndexes,n=observedNumber(equityValues[a]),d=observedNumber(equityValues[b]);if(n!==null&&d!==null&&d>0)put('equityGrowth',(n/d-1)*100,'balance',{period:balance.dates[a]!,method:'Variación del patrimonio entre los dos últimos cierres fiscales, con base anterior positiva.'});else unavailable.equityGrowth='La comparación porcentual no es interpretable con patrimonio anterior nulo o negativo.';}
    const cashAnnual=cash.headers.map((h,i)=>/^FY\s+\d{4}$/.test(h)?i:-1).filter(i=>i>=0&&cash.dates[i]!<=queriedAt.slice(0,10)),fcfs=cash.map.get('Free Cash Flow')||[];
    if(cashAnnual.length>=2){const [a,b]=cashAnnual,n=observedNumber(fcfs[a]),d=observedNumber(fcfs[b]);if(n!==null&&d!==null&&d>0)put('fcfGrowth',(n/d-1)*100,'cashFlow',{period:cash.dates[a]!,method:'Cambio de FCF entre los últimos cierres fiscales con base anterior positiva.'});else unavailable.fcfGrowth='El FCF anterior es nulo o negativo: se muestran los importes históricos en vez de un crecimiento porcentual engañoso.';}
    const buybacks=observedNumber(cash.map.get('Repurchase of Common Stock')?.[0],cash.scale||1);
    if(buybacks!==null&&cash.currency)put('buybacks',new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(Math.abs(buybacks)/1e6)+' millones '+cash.currency+' de recompra de acciones; período '+cash.headers[0]+' cerrado el '+cash.dates[0]+'.','cashFlow');
    if(values.shareDilution!==undefined)put('sharesGrowthReduction','Cambio interanual de acciones en circulación: '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(values.shareDilution)+'%. Incluye el efecto neto de emisiones y recompras.','statistics');
    const forecastIndex=forecast.headers.findIndex((h,i)=>/^FY\s+\d{4}$/.test(h)&&forecast.dates[i]!>queriedAt.slice(0,10)&&observedNumber(forecast.map.get('Revenue')?.[i])!==null);
    if(forecastIndex>=0&&reportCurrency==='USD'){const n=observedNumber(forecast.map.get('Revenue')?.[forecastIndex]);put('estimatedRevenue',n,'forecast',{currency:'USD',period:forecast.dates[forecastIndex]!,basis:'CONSENSUS'});put('revenueGuidance','Consenso de analistas para el ejercicio que cierra el '+forecast.dates[forecastIndex]+': '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(n!/1e6)+' millones USD. Es una estimación de analistas, no guidance publicado por la compañía.','forecast');}
    const description = company.$('h1').parent().find('p').toArray().map(p=>plain(company.$(p).text())).filter(Boolean).join(' ').split(/\s+/).slice(0,95).join(' ');
    const segmentsTable=income.tables.find(rows=>rows.some(row=>plain((row[0]||'').split(/\s{2,}/)[0])==='Revenue (Total)'));
    const segments = segmentsTable ? segmentsTable.map(row=>({name:plain((row[0]||'').split(/\s{2,}/)[0]),value:observedNumber(row[1],income.scale||1)})).filter(x=>x.value!==null&&!['Revenue (Total)','Fiscal Year','Period Ending'].includes(x.name)) : [];
    const segmentTotal=segmentsTable?observedNumber(segmentsTable.find(row=>plain((row[0]||'').split(/\s{2,}/)[0])==='Revenue (Total)')?.[1],income.scale||1):null;
    const earnings = sm.get('Earnings Date')?.[0], earningsTime = earnings ? Date.parse(earnings + ' 12:00:00 GMT') : NaN;
    const nextEarningsDate = Number.isFinite(earningsTime) && new Date(earningsTime).toISOString().slice(0,10)>=queriedAt.slice(0,10) ? new Date(earningsTime).toISOString().slice(0,10) : null;
    return {values,evidence,unavailable,peHistory,psHistory,description,reportCurrency,segments,segmentTotal,nextEarningsDate,periods:{income:income.dates[0],balance:balance.dates[0],cashFlow:cash.dates[0]},sources:Object.keys(pages).map(name=>source(name as PageName)),queriedAt};
}
const sectorCache = new Map<string,{at:number,value:any}>();
export async function fetchPublicFundamentals(ticker: string) {
    const pages: PublicPages = {};
    for (const [name,path] of Object.entries(paths)) {
        try { const r=await fetch('https://stockanalysis.com/stocks/'+encodeURIComponent(ticker.toLowerCase())+'/'+path,{headers:{'User-Agent':'Finix Research contact@finixarg.com'},signal:AbortSignal.timeout(12000)});if(r.status===429)break;if(r.ok)pages[name as PageName]=await r.text(); }catch{/* Retain source gaps for review; never replace them with sample values. */}
        await new Promise(resolve=>setTimeout(resolve,650));
    }
    return parsePublicFundamentals(ticker,pages);
}
export async function publicSectorValuations() {
    const existing=sectorCache.get('all');if(existing&&Date.now()-existing.at<86400000)return existing.value;
    const r=await fetch('https://finviz.com/groups.ashx?g=sector&v=120&o=name',{headers:{'User-Agent':'Finix Research contact@finixarg.com'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('No se pudo consultar la referencia sectorial.');
    const value=parseSectorValuations(await r.text());sectorCache.set('all',{at:Date.now(),value});return value;
}
export function parseSectorValuations(html:string) {
    const $=load(html),result:Record<string,{pe:number;ps:number;pb:number;source:string;queriedAt:string}>= {};
    for(const tr of $('tr').toArray()) {const cells=$(tr).children('td').toArray().map(c=>plain($(c).text()));if(cells.length<9)continue;const name=sectorNames[cells[1]]||({'Financial':'Finanzas'} as Record<string,string>)[cells[1]];const pe=observedNumber(cells[3]),ps=observedNumber(cells[6]),pb=observedNumber(cells[7]);if(name&&pe!==null&&pe>0&&ps!==null&&pb!==null)result[name]={pe,ps,pb,source:'https://finviz.com/groups.ashx?g=sector&v=120&o=name',queriedAt:new Date().toISOString()};}
    return result;
}
