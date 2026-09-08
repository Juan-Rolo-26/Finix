/**
 * AssetBadge.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified component to display an asset anywhere in the app.
 * Shows: Logo · Exchange badge · Full name · Ticker · Live price (optional)
 *
 * Usage:
 *   <AssetBadge symbol="NASDAQ:AAPL" showPrice />
 *   <AssetBadge symbol="BCBA:GGAL" size="sm" />
 *   <AssetBadge symbol="CRYPTO:BTC" showPrice layout="horizontal" />
 */

import { useLivePrice, resolveAssetInfo } from '@/lib/tradingview';
import { SymbolLogo } from '@/components/SymbolLogo';
import { cn } from '@/lib/utils';

// ─── Price formatter ──────────────────────────────────────────────────────────

function fmtPrice(price: number | null, decimals?: number): string {
    if (price === null || !Number.isFinite(price)) return '—';
    const dec = decimals ?? (Math.abs(price) >= 100 ? 2 : Math.abs(price) >= 1 ? 4 : 6);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
    }).format(price);
}

function fmtChange(change: number | null): string {
    if (change === null || !Number.isFinite(change)) return '';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

// ─── AssetBadge ──────────────────────────────────────────────────────────────

interface AssetBadgeProps {
    /** Full symbol like "NASDAQ:AAPL", "BCBA:GGAL", "CRYPTO:BTC" */
    symbol: string;
    /** Override display name (used if provided by API) */
    nameOverride?: string;
    /** Show live price & change from backend */
    showPrice?: boolean;
    /** Visual size preset */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Layout direction */
    layout?: 'horizontal' | 'vertical';
    className?: string;
    /** Click handler */
    onClick?: () => void;
    /** If true, price is shown inline next to the name */
    compactPrice?: boolean;
}

const SIZE_CONFIG = {
    xs: { logo: 24, ticker: 'text-[11px]', name: 'text-[10px]', price: 'text-[10px]', gap: 'gap-1.5' },
    sm: { logo: 30, ticker: 'text-[12px]', name: 'text-[11px]', price: 'text-[11px]', gap: 'gap-2' },
    md: { logo: 36, ticker: 'text-[13px]', name: 'text-[12px]', price: 'text-[13px]', gap: 'gap-2.5' },
    lg: { logo: 44, ticker: 'text-[15px]', name: 'text-[13px]', price: 'text-[15px]', gap: 'gap-3' },
};

export function AssetBadge({
    symbol,
    nameOverride,
    showPrice = false,
    size = 'md',
    layout = 'horizontal',
    className,
    onClick,
    compactPrice = false,
}: AssetBadgeProps) {
    const info = resolveAssetInfo(symbol);
    const { price, change, loading } = useLivePrice(showPrice ? symbol : '');
    const cfg = SIZE_CONFIG[size];
    const isUp = (change ?? 0) >= 0;
    const Tag = onClick ? 'button' : 'div';

    const displayName = nameOverride || info.displayName;

    return (
        <Tag
            onClick={onClick}
            className={cn(
                'flex items-center',
                cfg.gap,
                layout === 'vertical' ? 'flex-col text-center' : 'flex-row',
                onClick && 'hover:opacity-80 transition-opacity cursor-pointer',
                className,
            )}
        >
            {/* Logo */}
            <SymbolLogo symbol={symbol} size={cfg.logo} />

            {/* Info */}
            <div className={cn('flex flex-col min-w-0', layout === 'vertical' ? 'items-center' : 'items-start')}>
                {/* Exchange + Ticker row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('font-bold text-foreground leading-tight', cfg.ticker)}>
                        {info.exchange ? `${info.exchange}:${info.ticker}` : info.ticker}
                    </span>
                    {showPrice && compactPrice && !loading && price !== null && (
                        <span className={cn('font-bold tabular-nums ml-1', cfg.price, isUp ? 'text-emerald-400' : 'text-rose-400')}>
                            {fmtPrice(price)}
                        </span>
                    )}
                </div>

                {/* Full name */}
                <span className={cn('text-muted-foreground leading-tight truncate max-w-[200px]', cfg.name)}>
                    {displayName}
                </span>

                {/* Price block (non-compact) */}
                {showPrice && !compactPrice && (
                    <div className="flex items-center gap-2 mt-0.5">
                        {loading ? (
                            <span className={cn('text-muted-foreground/50 animate-pulse', cfg.price)}>Cargando...</span>
                        ) : price !== null ? (
                            <>
                                <span className={cn('font-bold tabular-nums', cfg.price)}>{fmtPrice(price)}</span>
                                {change !== null && (
                                    <span className={cn('font-semibold', cfg.price, isUp ? 'text-emerald-400' : 'text-rose-400')}>
                                        {fmtChange(change)}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className={cn('text-muted-foreground/40', cfg.price)}>Sin precio</span>
                        )}
                    </div>
                )}
            </div>
        </Tag>
    );
}

// ─── AssetRow — full width row for tables/lists ───────────────────────────────

interface AssetRowInfoProps {
    symbol: string;
    nameOverride?: string;
    /** Extra info line below the name */
    subtext?: string;
    size?: 'sm' | 'md' | 'lg';
    showLivePrice?: boolean;
    className?: string;
}

export function AssetRowInfo({ symbol, nameOverride, subtext, size = 'md', showLivePrice = false, className }: AssetRowInfoProps) {
    const info = resolveAssetInfo(symbol);
    const cfg = SIZE_CONFIG[size];
    const { price, change, loading } = useLivePrice(showLivePrice ? symbol : '');
    const isUp = (change ?? 0) >= 0;

    const displayName = nameOverride || info.displayName;

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <SymbolLogo symbol={symbol} size={cfg.logo} />

            <div className="flex flex-col min-w-0 flex-1">
                {/* Exchange + Ticker */}
                <div className="flex items-center gap-1.5">
                    <span className={cn('font-bold text-foreground', cfg.ticker)}>
                        {info.exchange ? `${info.exchange}:${info.ticker}` : info.ticker}
                    </span>
                </div>

                {/* Name */}
                <span className={cn('text-muted-foreground truncate', cfg.name)}>
                    {displayName}
                </span>

                {/* Extra subtext */}
                {subtext && (
                    <span className="text-[10px] text-muted-foreground/60 truncate">{subtext}</span>
                )}
            </div>

            {/* Live price */}
            {showLivePrice && (
                <div className="text-right shrink-0">
                    {loading ? (
                        <div className="w-12 h-3.5 bg-muted/40 rounded animate-pulse" />
                    ) : price !== null ? (
                        <>
                            <div className={cn('font-bold tabular-nums', cfg.price)}>{fmtPrice(price)}</div>
                            {change !== null && (
                                <div className={cn('text-[10px] font-semibold', isUp ? 'text-emerald-400' : 'text-rose-400')}>
                                    {fmtChange(change)}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export default AssetBadge;
