/** Missing values stay missing; a real zero or loss is still financial data. */
export function financialNumber(value: unknown): number | undefined {
    if (typeof value !== 'number' && typeof value !== 'string') return undefined;
    if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function isCalendarDate(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface EarningsFinancialData {
    epsEstimate?: number | null;
    revenueEstimate?: number | null;
    actualEps?: number | null;
    actualRevenue?: number | null;
    epsSurprise?: number | null;
    revenueSurprise?: number | null;
    marketCap?: number | null;
    marketReaction?: number | null;
    sourceType?: string;
    source?: string;
    time?: string | null;
}

export function earningsSurprise(actual: unknown, estimate: unknown): number | undefined {
    const result = financialNumber(actual);
    const forecast = financialNumber(estimate);
    if (result === undefined || forecast === undefined || forecast === 0) return undefined;
    return financialNumber((result - forecast) / Math.abs(forecast) * 100);
}

export function normalizeEarnings<T extends EarningsFinancialData>(event: T): T {
    const epsEstimate = financialNumber(event.epsEstimate);
    const revenueEstimate = financialNumber(event.revenueEstimate);
    const actualEps = financialNumber(event.actualEps);
    const actualRevenue = financialNumber(event.actualRevenue);
    const marketCap = financialNumber(event.marketCap);
    return {
        ...event, epsEstimate, revenueEstimate, actualEps, actualRevenue,
        time: event.sourceType === 'AUTOMATIC' && event.source?.includes('TradingView') ? undefined : event.time,
        epsSurprise: earningsSurprise(actualEps, epsEstimate),
        revenueSurprise: earningsSurprise(actualRevenue, revenueEstimate),
        marketCap: marketCap !== undefined && marketCap > 0 ? marketCap : undefined,
        // Automatic feeds supplied a daily quote change, not a measured report reaction.
        marketReaction: event.sourceType === 'MANUAL' ? financialNumber(event.marketReaction) : undefined,
    };
}

export function hasEarningsData(event: EarningsFinancialData): boolean {
    return [event.actualEps, event.actualRevenue, event.epsEstimate, event.revenueEstimate]
        .some(value => financialNumber(value) !== undefined);
}

export function isVisibleEarnings(event: EarningsFinancialData & { ticker?: string; date?: string }): boolean {
    return Boolean(event.ticker?.trim()) && isCalendarDate(event.date) && hasEarningsData(event);
}

export function formatFinancialAmount(value: unknown): string {
    const amount = financialNumber(value);
    if (amount === undefined) return '';
    const absolute = Math.abs(amount);
    for (const [threshold, suffix] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) {
        if (absolute >= threshold) return `$${(amount / threshold).toFixed(2)}${suffix}`;
    }
    return `$${amount.toFixed(2)}`;
}
