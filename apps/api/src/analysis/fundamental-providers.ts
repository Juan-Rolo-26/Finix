import type { FundamentalInputs } from './verified-fundamentals';

type Receipt = { source: string; status: string; at: string };
export interface CollectedFundamentals { inputs: FundamentalInputs; chart: any; balance: any; income: any; cashFlow: any; alpha: any; receipts: Receipt[]; }
const cooldown = new Map<string, number>();
let finnhubSlot = 0;
let issuers: { at: number; data: any } | undefined;
const number = (x: unknown) => typeof x === 'number' && Number.isFinite(x) ? x : null;
const parsed = (x: unknown) => typeof x === 'number' ? number(x) : typeof x === 'string' && /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : null;
export function addTwoMonths(value: Date) {
    const target = new Date(value); const day = target.getUTCDate(); target.setUTCDate(1); target.setUTCMonth(target.getUTCMonth() + 2);
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate(); target.setUTCDate(Math.min(day, last)); return target;
}
export async function collectFundamentalInputs(raw: string, marketOnly = false): Promise<CollectedFundamentals> {
    const ticker = raw.trim().toUpperCase().split(':').at(-1)!;
    if (!/^[A-Z0-9.-]{1,16}$/.test(ticker)) throw new Error('Ticker invÃ¡lido.');
    const receipts: Receipt[] = [];
    const read = async (source: string, url: string, bucket = source) => {
        if ((cooldown.get(bucket) || 0) > Date.now()) { receipts.push({ source, status: 'cooldown', at: new Date().toISOString() }); return null; }
        if (source.startsWith('Finnhub')) { const slot = Math.max(Date.now(), finnhubSlot); finnhubSlot = slot + 1250; await new Promise(resolve => setTimeout(resolve, Math.max(0, slot - Date.now()))); }
        try {
            const r = await fetch(url, { headers: { 'User-Agent': 'Finix Research contact@finixarg.com' }, signal: AbortSignal.timeout(16000) });
            const data = r.ok ? await r.json().catch(() => null) : null;
            const limited = r.status === 429 || !!data?.Note || !!data?.Information;
            if ([401, 402, 403].includes(r.status)) cooldown.set(bucket, Date.now() + 86400000);
            if (limited) cooldown.set(bucket, Date.now() + 3600000);
            receipts.push({ source, status: limited ? 'limited' : data ? 'ok' : 'http-' + r.status, at: new Date().toISOString() });
            return limited || data?.['Error Message'] ? null : data;
        } catch { receipts.push({ source, status: 'unavailable', at: new Date().toISOString() }); return null; }
    };
    const fk = encodeURIComponent(process.env.FMP_API_KEY || ''), hk = encodeURIComponent(process.env.FINNHUB_API_KEY || '');
    const fmp = (path: string) => fk ? read('FMP ' + path, 'https://financialmodelingprep.com/stable/' + path + '?symbol=' + encodeURIComponent(ticker) + '&limit=5&apikey=' + fk, 'fmp:' + path) : Promise.resolve(null);
    const chartPromise = read('Yahoo Finance sesiones', 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?range=3mo&interval=1d', 'yahoo');
    if (marketOnly) { const chart = await chartPromise; const profile = chart?.chart?.result?.length ? {} : (await fmp('profile'))?.[0]; return { inputs: { ticker, profile, queriedAt: new Date().toISOString() }, chart, balance: null, income: null, cashFlow: null, alpha: null, receipts }; }
    const profilePromise = fmp('profile');
    const [profileRows, finnhub, finnhubProfile, reported] = await Promise.all([profilePromise,
        hk ? read('Finnhub mÃ©tricas', 'https://finnhub.io/api/v1/stock/metric?symbol=' + ticker + '&metric=all&token=' + hk, 'finnhub') : null,
        hk ? read('Finnhub perfil', 'https://finnhub.io/api/v1/stock/profile2?symbol=' + ticker + '&token=' + hk, 'finnhub') : null,
        hk ? read('Finnhub reportes', 'https://finnhub.io/api/v1/stock/financials-reported?symbol=' + ticker + '&freq=annual&token=' + hk, 'finnhub') : null]);
    const profile = profileRows?.[0] || {};
    let cik = profile.cik;
    if (!cik) {
        if (!issuers || Date.now() - issuers.at > 86400000) { const data = await read('SEC emisores', 'https://www.sec.gov/files/company_tickers.json', 'sec'); if (data) issuers = { at: Date.now(), data }; }
        cik = (Object.values(issuers?.data || {}) as any[]).find(x => x.ticker === ticker)?.cik_str;
    }
    const [sec, ratios, metrics, chart] = await Promise.all([
        cik ? read('SEC estados financieros', 'https://data.sec.gov/api/xbrl/companyfacts/CIK' + String(cik).padStart(10, '0') + '.json', 'sec') : null,
        fmp('ratios-ttm'), fmp('key-metrics-ttm'), chartPromise]);
    // Additional actual statements fill gaps in XBRL coverage; never infer a missing line item from a sample company.
    const [balance, income, cashFlow] = await Promise.all([fmp('balance-sheet-statement'), fmp('income-statement'), fmp('cash-flow-statement')]);
    let alpha = null;
    const ak = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHAVANTAGE_API_KEY;
    if (ak && (!profile.companyName || !finnhub?.metric || !Object.keys(finnhub.metric).length)) alpha = await read('Alpha Vantage perfil', 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=' + ticker + '&apikey=' + encodeURIComponent(ak), 'alpha');
    if (!profile.companyName && !finnhubProfile?.name && !sec?.entityName && !alpha?.Name) throw new Error('No se pudo verificar la empresa en las fuentes configuradas.');
    return { inputs: { ticker, profile: { ...profile, exchangeShortName: profile.exchangeShortName || profile.exchange || alpha?.Exchange, companyName: profile.companyName || alpha?.Name }, finnhubProfile, finnhub, sec, reported, ratios: ratios?.[0], keyMetrics: metrics?.[0], queriedAt: new Date().toISOString() }, chart, balance, income, cashFlow, alpha, receipts };
}

export function marketObservation(collected: CollectedFundamentals) {
    const p = collected.inputs.profile || {}, chart = collected.chart?.chart?.result?.[0], quotes = chart?.indicators?.quote?.[0];
    const rows = (chart?.timestamp || []).map((t: number, i: number) => ({ at: new Date(t * 1000).toISOString(), close: number(quotes?.close?.[i]), volume: number(quotes?.volume?.[i]) })).filter((r: any) => r.volume !== null && r.close !== null);
    const last = rows.at(-1), previous = rows.slice(0, -1).slice(-30);
    const avg = previous.length === 30 ? previous.reduce((n: number, r: any) => n + r.volume, 0) / 30 : null;
    const volume = last ? last.volume : number(p.volume);
    const previousClose = rows.at(-2)?.close; const change = last && previousClose > 0 ? (last.close / previousClose - 1) * 100 : number(p.changePercentage);
    // A generic provider average is not relabelled as 30 sessions.
    return { values: { currentPrice: last?.close ?? number(p.price), dailyChange: change, marketCap: number(p.marketCap), volume, avgVolume: avg, relativeVolume: volume !== null && avg !== null && avg > 0 ? volume / avg : null },
        meta: { source: last ? 'Yahoo Finance' : 'FMP perfil', sessionAt: last?.at || null, queriedAt: collected.inputs.queriedAt, averageSessions: previous.length === 30 ? 30 : null, averageExcludesCurrentSession: true } };
}
export function supplementFundamentals(data: Record<string, any>, c: CollectedFundamentals) {
    const meta = data.historicalSeries.meta, p = c.inputs.profile || {}, gaap = c.inputs.sec?.facts?.['us-gaap'] || {}, now = (c.inputs.queriedAt || new Date().toISOString()).slice(0, 10);
    const at = (tags: string[]) => { for (const tag of tags) { const row = (gaap[tag]?.units?.[meta.currency] || []).filter((x: any) => !x.start && x.end === meta.balance && x.filed <= now && number(x.val) !== null).sort((a: any, b: any) => b.filed.localeCompare(a.filed))[0]; if (row) return { value: row.val, tag }; } return null; };
    const current = at(['DebtCurrent']), long = at(['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations']), total = at(['DebtLongtermAndShorttermCombinedAmount']);
    if (current) data.shortTermDebt = current.value; if (long) data.longTermDebt = long.value;
    if (total) data.totalDebt = total.value; else if (current && long) data.totalDebt = current.value + long.value;
    const statement = (rows: any[]) => (Array.isArray(rows) ? rows : []).filter(x => x.date <= now && x.reportedCurrency === meta.currency && (!x.filingDate || x.filingDate.slice(0, 10) <= now)).sort((a, b) => b.date.localeCompare(a.date))[0];
    const bs = statement(c.balance);
    if (bs && (!meta.balance || bs.date === meta.balance)) {
        const same = true; meta.balance ||= bs.date;
        for (const [field, key] of Object.entries({ cash: 'cashAndCashEquivalents', totalDebt: 'totalDebt', longTermDebt: 'longTermDebt', shortTermDebt: 'shortTermDebt', totalAssets: 'totalAssets', totalLiabilities: 'totalLiabilities', equity: 'totalStockholdersEquity' })) {
            if ((same || data[field] == null) && data[field] == null && number(bs[key]) !== null) { data[field] = bs[key]; (meta.fieldSources ||= {})[field] = { source: 'FMP balance', period: bs.date, currency: bs.reportedCurrency }; }
        }
    }
    const inc = statement(c.income), cf = statement(c.cashFlow);
    if (inc && data.revenue === null && number(inc.revenue) !== null) {
        data.revenue = inc.revenue; meta.revenue = inc.date; meta.basis = 'FY';
        for (const [field, key] of Object.entries({ ebit: 'operatingIncome', ebitda: 'ebitda', eps: 'epsDiluted' })) if (data[field] === null && number(inc[key]) !== null) data[field] = inc[key];
        for (const [field, key] of Object.entries({ netMargin: 'netIncome', operatingMargin: 'operatingIncome', grossMargin: 'grossProfit' })) if (data[field] === null && inc.revenue > 0 && number(inc[key]) !== null) data[field] = inc[key] / inc.revenue * 100;
    }
    if (cf && data.freeCashFlow === null && number(cf.operatingCashFlow) !== null && number(cf.capitalExpenditure) !== null) {
        data.operatingCashFlow = cf.operatingCashFlow; data.capEx = Math.abs(cf.capitalExpenditure); data.freeCashFlow = data.operatingCashFlow - data.capEx; meta.cashFlow = cf.date; meta.cashFlowBasis = 'FY';
        data.fcfMargin = meta.revenue === cf.date && meta.basis === 'FY' && data.revenue > 0 ? data.freeCashFlow / data.revenue * 100 : null; data.earningsToCashConversion = null;
    }
    if (data.totalDebt !== null && data.cash !== null) data.netDebt = data.totalDebt - data.cash;
    if (meta.currency === 'USD') {
        if (data.priceToSales === null && data.marketCap > 0 && data.revenue > 0) data.priceToSales = data.marketCap / data.revenue;
        if (data.priceToBook === null && data.marketCap > 0 && data.equity > 0) data.priceToBook = data.marketCap / data.equity;
        if (data.priceToFcf === null && data.marketCap > 0 && data.freeCashFlow > 0) data.priceToFcf = data.marketCap / data.freeCashFlow;
    }

    if (data.beta === null) data.beta = number(p.beta);
    const obs = marketObservation(c); for (const [key, value] of Object.entries(obs.values)) if (value !== null) data[key] = value;
    meta.market = obs.meta; meta.providers = c.receipts; meta.refreshPolicy = { calendarMonths: 2, nextDueAt: addTwoMonths(new Date(c.inputs.queriedAt!)).toISOString() };
    // Alpha values are admitted only for the requested issuer; "None", quotas and demo replies never become zero.
    if (c.alpha?.Symbol === c.inputs.ticker) {
        const map = { peRatio: 'PERatio', forwardPe: 'ForwardPE', priceToBook: 'PriceToBookRatio', priceToSales: 'PriceToSalesRatioTTM', beta: 'Beta', insiderOwnership: 'PercentInsiders', institutionalOwnership: 'PercentInstitutions' };
        for (const [field, key] of Object.entries(map)) if (data[field] == null && parsed(c.alpha[key]) !== null) { data[field] = parsed(c.alpha[key]); (meta.fieldSources ||= {})[field] = { source: 'Alpha Vantage', queriedAt: c.inputs.queriedAt }; }
    }
    meta.unavailable = {};
    for (const [key, value] of Object.entries(data)) if (value === null) meta.unavailable[key] = { reason: 'No se obtuvo un valor verificable en las fuentes consultadas. No equivale a cero.', checkedAt: c.inputs.queriedAt };
    if (data.peRatio === null && data.eps !== null && data.eps <= 0) meta.unavailable.peRatio.reason = 'No aplica un P/E positivo: el beneficio por acciÃ³n reportado es nulo o negativo.';
    if (data.priceToBook === null && data.equity !== null && data.equity <= 0) meta.unavailable.priceToBook.reason = 'No es interpretable con patrimonio neto nulo o negativo.';
    data.sources += ' Â· Fuentes alternativas consultadas: ' + c.receipts.map(r => r.source + ' (' + (r.status === 'ok' ? 'datos recibidos' : r.status === 'limited' ? 'límite de consultas' : ['http-401', 'http-402', 'http-403'].includes(r.status) ? 'acceso no habilitado' : 'sin respuesta válida') + ')').join(', ') + '. Volumen: Ãºltima sesiÃ³n disponible; promedio de 30 sesiones previas completas.';
    return data;
}
