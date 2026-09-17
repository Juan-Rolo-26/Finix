import { motion } from 'framer-motion';
import { TrendingDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { AssetLogoImg, TopGainerItem } from './TopGainersCard';

export interface TopLosersCardProps {
    items: TopGainerItem[];
    isLoading: boolean;
    isError: boolean;
    isStale?: boolean;
    date?: string;
    onRetry?: () => void;
}

export function TopLosersCard({
    items,
    isLoading,
    isError,
    isStale,
    date,
    onRetry,
}: TopLosersCardProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="rounded-2xl overflow-hidden border border-border/50 bg-card shrink-0"
        >
            {/* ── Card Header ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: 'hsl(0 72% 55% / 0.15)' }}
                    >
                        <TrendingDown className="w-4 h-4" style={{ color: 'hsl(0 72% 58%)' }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[13px] font-bold tracking-tight text-foreground">Peores rendimientos</h3>
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                S&P 500
                            </span>
                        </div>
                        {isStale && (
                            <p className="text-[10px] font-medium text-muted-foreground/70">
                                Último cierre {date ? `(${date})` : ''}
                            </p>
                        )}
                    </div>
                </div>

                <Link
                    to="/mercado/mejores-rendimientos?tab=losers"
                    className="text-[11.5px] font-semibold flex items-center gap-0.5 transition-colors text-rose-400/80 hover:text-rose-400 group"
                >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* ── Card Content / States ── */}
            <div className="p-2.5 pb-3.5 space-y-1">
                {/* 1. State: Loading Skeleton */}
                {isLoading && (
                    <div className="space-y-1.5 p-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-3 bg-white/10 rounded" />
                                    <div className="w-8 h-8 rounded-xl bg-white/10" />
                                    <div className="space-y-1">
                                        <div className="w-12 h-3.5 bg-white/10 rounded" />
                                        <div className="w-20 h-2.5 bg-white/5 rounded" />
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="w-14 h-3.5 bg-white/10 rounded ml-auto" />
                                    <div className="w-10 h-3 bg-white/5 rounded ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. State: Error */}
                {!isLoading && isError && (
                    <div className="p-5 text-center space-y-2">
                        <AlertCircle className="w-6 h-6 mx-auto text-destructive/70" />
                        <p className="text-[12.5px] font-medium text-muted-foreground">
                            No pudimos cargar los rendimientos.
                        </p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" /> Reintentar
                            </button>
                        )}
                    </div>
                )}

                {/* 3. State: Empty */}
                {!isLoading && !isError && items.length === 0 && (
                    <div className="p-5 text-center">
                        <p className="text-[12.5px] font-medium text-muted-foreground">
                            Todavía no hay datos de rendimiento disponibles.
                        </p>
                    </div>
                )}

                {/* 4. State: Success (Exact 5 rows) */}
                {!isLoading && !isError && items.length > 0 && (
                    <div className="space-y-0.5">
                        {items.slice(0, 5).map((item, index) => {
                            const rank = item.rank || index + 1;
                            const volFormatted = item.volume >= 1_000_000
                                ? `${(item.volume / 1_000_000).toFixed(1)}M`
                                : item.volume >= 1_000
                                    ? `${(item.volume / 1_000).toFixed(1)}K`
                                    : item.volume.toLocaleString();

                            const percentFormatted = item.changePercent > 0
                                ? `-${item.changePercent.toFixed(2)}%`
                                : `${item.changePercent.toFixed(2)}%`;

                            return (
                                <button
                                    key={item.ticker}
                                    onClick={() => navigate(`/market?symbol=NASDAQ:${item.ticker}`)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all hover:bg-white/[0.04] group text-left"
                                >
                                    {/* Left: Rank + Logo + Ticker/Name */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="text-[11px] font-black w-3.5 text-center flex-shrink-0"
                                            style={{ color: rank <= 3 ? 'hsl(0 72% 58%)' : 'hsl(var(--muted-foreground) / 0.6)' }}
                                        >
                                            {rank}
                                        </span>

                                        <AssetLogoImg src={item.logoUrl} ticker={item.ticker} name={item.companyName} />

                                        <div className="min-w-0 pr-1">
                                            <p className="text-[12.5px] font-bold leading-tight group-hover:text-rose-400 transition-colors truncate">
                                                {item.ticker}
                                            </p>
                                            <p className="text-[10px] font-medium text-muted-foreground/60 truncate max-w-[110px] sm:max-w-[130px]">
                                                {item.companyName || item.ticker}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Price + Volume + Percentage */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[12.5px] font-bold num text-foreground">
                                            {formatCurrency(item.price, 'USD')}
                                        </p>
                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-medium text-muted-foreground/50 num">
                                                {volFormatted}
                                            </span>
                                            <div
                                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold num"
                                                style={{
                                                    background: 'hsl(0 72% 55% / 0.12)',
                                                    color: 'hsl(0 72% 62%)',
                                                }}
                                            >
                                                <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
                                                <span>{percentFormatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default TopLosersCard;
