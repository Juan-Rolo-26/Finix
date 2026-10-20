import type { MarketQuote } from '../market/market.service';

// Sector definitions: https://www.ssga.com/us/en/individual/capabilities/equities/sector-investing/select-sector-etfs
export const NEWSLETTER_SECTOR_ETFS: Record<string, string> = {
    XLC: 'Comunicaciones', XLY: 'Consumo discrecional', XLP: 'Consumo básico',
    XLE: 'Energía', XLF: 'Finanzas', XLV: 'Salud', XLI: 'Industria',
    XLB: 'Materiales', XLRE: 'Bienes raíces', XLK: 'Tecnología', XLU: 'Servicios públicos',
};

export function leadingSectorEtf(quotes: MarketQuote[]) {
    const observed = new Map<string, { name: string; perf: number; proxySymbol: string }>();
    for (const quote of quotes) {
        const ticker = quote.inputSymbol.split(':').pop() || '';
        if (!Object.prototype.hasOwnProperty.call(NEWSLETTER_SECTOR_ETFS, ticker) || quote.symbol.split(':').pop() !== ticker || quote.unavailable ||
            typeof quote.price !== 'number' || !Number.isFinite(quote.price) || quote.price <= 0 ||
            typeof quote.change !== 'number' || !Number.isFinite(quote.change)) continue;
        observed.set(ticker, { name: NEWSLETTER_SECTOR_ETFS[ticker], perf: quote.change, proxySymbol: ticker });
    }
    // Do not name a winner when any of the eleven sectors is missing.
    if (observed.size !== Object.keys(NEWSLETTER_SECTOR_ETFS).length) return null;
    return [...observed.values()].sort((a, b) => b.perf - a.perf || a.proxySymbol.localeCompare(b.proxySymbol))[0];
}
