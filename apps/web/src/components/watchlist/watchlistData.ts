export type WatchlistPeriod = '1D' | '1W' | '1M';
export interface WatchlistPricePoint { time: number; close: number }
export interface WatchlistHistory { points: WatchlistPricePoint[]; loading: boolean; error: boolean }

export function normalizeWatchlistHistory(value: unknown): WatchlistPricePoint[] {
    if (!Array.isArray(value)) return [];
    const points = value.filter(point => typeof point?.time === 'number' && Number.isFinite(point.time)
        && point.time > 0 && point.time <= Date.now() / 1000 && typeof point.close === 'number' && Number.isFinite(point.close) && point.close > 0);
    return [...new Map(points.map(point => [point.time, { time: point.time, close: point.close }])).values()].sort((a, b) => a.time - b.time);
}

export function watchlistPeriodChange(item: any, points: WatchlistPricePoint[], period: WatchlistPeriod): number | null {
    if (period === '1D') return !item.isUnavailable && Number.isFinite(item.changePercent) ? item.changePercent : null;
    const end = Number.isFinite(item.currentPrice) && item.currentPrice > 0 && !item.isUnavailable ? item.currentPrice : points.at(-1)?.close;
    const last = points.at(-1);
    if (!last || !end || last.time < Date.now() / 1000 - 7 * 86400) return null;
    const cutoff = new Date();
    if (period === '1W') cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    else cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
    const baseline = [...points].reverse().find(point => point.time <= cutoff.getTime() / 1000);
    if (!baseline || baseline.time < cutoff.getTime() / 1000 - 7 * 86400) return null;
    return (end / baseline.close - 1) * 100;
}

export function watchlistChartSymbol(item: any): string {
    const symbol = item.chartSymbol || item.symbol;
    if (symbol.includes(':')) return symbol.replace(/^BYMA:/, 'BCBA:');
    if (['BCBA', 'BYMA'].includes(item.market)) return `BCBA:${symbol.replace(/\.BA$/, '')}`;
    if (item.assetType === 'CRYPTO') return /USDT$/.test(symbol) ? `BINANCE:${symbol}` : `CRYPTO:${symbol.replace(/-?USD$/, '')}USD`;
    return symbol;
}
