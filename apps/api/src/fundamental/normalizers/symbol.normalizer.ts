import { AssetType, FundamentalSearchItem, ResolvedSymbol } from '../types/fundamental.types';

function inferAssetType(exchange: string, explicitType?: string): AssetType {
    const type = (explicitType || '').toLowerCase();
    const ex = (exchange || '').toUpperCase();

    if (type.includes('crypto') || ex === 'CRYPTO' || ex === 'BINANCE') return 'crypto';
    if (type.includes('forex') || ex === 'FX' || ex === 'OANDA') return 'forex';
    if (type.includes('commodity') || ex === 'TVC') return 'commodity';
    if (type.includes('index') || ex === 'INDEX' || ex === 'TVC') return 'index';
    if (type.includes('etf')) return 'etf';
    if (ex === 'BCBA' || ex === 'BYMA') return 'cedear';
    if (type.includes('stock') || ex === 'NASDAQ' || ex === 'NYSE' || ex === 'AMEX') return 'stock';
    return 'other';
}

function normalizeTickerForAsset(rawTicker: string, assetType: AssetType): string {
    const ticker = (rawTicker || '').toUpperCase().replace(/\s+/g, '');
    if (!ticker) return ticker;

    if (assetType === 'crypto' && ticker.endsWith('USDT')) {
        return `${ticker.slice(0, -4)}USD`;
    }

    return ticker;
}

export function fromSearchResult(input: {
    input: string;
    symbol: string;
    exchange?: string;
    type?: string;
    name?: string;
}): FundamentalSearchItem {
    const fullSymbol = (input.symbol || '').toUpperCase();
    const hasPrefix = fullSymbol.includes(':');
    const [prefix, rawSymbol] = hasPrefix ? fullSymbol.split(':', 2) : [input.exchange || '', fullSymbol];
    const exchange = (input.exchange || prefix || '').toUpperCase();
    const assetType = inferAssetType(exchange, input.type);
    const normalizedTicker = normalizeTickerForAsset(rawSymbol, assetType);

    return {
        input: input.input,
        tvSymbol: hasPrefix ? fullSymbol : `${exchange}:${rawSymbol}`,
        normalizedTicker,
        exchange,
        assetType,
        name: input.name || normalizedTicker,
    };
}

export function fromDirectTicker(ticker: string): ResolvedSymbol {
    const cleaned = (ticker || '').trim().toUpperCase();
    const hasPrefix = cleaned.includes(':');
    const [exchange, raw] = hasPrefix ? cleaned.split(':', 2) : ['', cleaned];
    const inferredType = inferAssetType(exchange, undefined);
    const normalizedTicker = normalizeTickerForAsset(raw, inferredType);

    return {
        input: ticker,
        tvSymbol: hasPrefix ? cleaned : normalizedTicker,
        normalizedTicker,
        exchange: exchange || 'AUTO',
        assetType: inferredType,
        name: normalizedTicker,
    };
}
