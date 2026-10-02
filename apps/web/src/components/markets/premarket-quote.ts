import type { PremarketAsset } from './PreMarketSection';

export interface DisplayPremarketAsset extends PremarketAsset {
    requiresPremarket: boolean;
}

function finiteNumber(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function resolvePremarketQuote(
    asset: PremarketAsset,
): DisplayPremarketAsset {
    const requiresPremarket = /^(NASDAQ|NYSE|AMEX):/i.test(asset.symbol);
    const explicitPrice = finiteNumber(asset.premarketPrice);
    // Older snapshots stored their pre-market quote only in price/change.
    const legacyQuote =
        asset.premarketPrice === undefined && asset.isPremarketQuote === true;
    const premarketPrice =
        explicitPrice ?? (legacyQuote ? finiteNumber(asset.price) : null);
    const hasPremarket = premarketPrice !== null && premarketPrice > 0;
    const premarketChange =
        finiteNumber(asset.premarketChange) ??
        (legacyQuote && asset.premarketChange === undefined
            ? finiteNumber(asset.change)
            : null);
    const regularPrice =
        finiteNumber(asset.regularPrice) ??
        (!asset.isPremarketQuote ? finiteNumber(asset.price) : null);
    const regularChange =
        finiteNumber(asset.regularChange) ??
        (!asset.isPremarketQuote ? finiteNumber(asset.change) : null);
    const price = hasPremarket
        ? premarketPrice
        : requiresPremarket
          ? null
          : finiteNumber(asset.price);
    const change = hasPremarket
        ? premarketChange
        : requiresPremarket
          ? null
          : finiteNumber(asset.change);

    return {
        ...asset,
        requiresPremarket,
        price,
        change: price === null ? null : change,
        regularPrice,
        regularChange,
        isPremarketQuote: hasPremarket,
        unavailable: price === null,
    };
}
