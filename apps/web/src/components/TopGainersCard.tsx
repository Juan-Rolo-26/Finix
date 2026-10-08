import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export interface TopGainerItem {
    rank: number;
    ticker: string;
    companyName: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    logoUrl: string;
    timestamp: string;
}

export interface TopGainersCardProps {
    items: TopGainerItem[];
    isLoading: boolean;
    isError: boolean;
    isStale?: boolean;
    date?: string;
    onRetry?: () => void;
}

import { getLogoUrls } from '@/lib/tradingview';

/* ── Fallback Logo Helper with Multi-Candidate Fallback ── */
export function AssetLogoImg({ src, ticker, name }: { src?: string; ticker: string; name: string }) {
    const candidates = useMemo(() => {
        const list: string[] = [];
        // Prioridad 1: src enviado por backend (TradingView SVG canónico)
        if (src && !list.includes(src)) list.push(src);

        // Prioridad 2: URLs de TradingView generadas en el cliente
        const tvList = getLogoUrls(ticker);
        for (const u of tvList) {
            if (!list.includes(u)) list.push(u);
        }

        // Prioridad 3: FMP high-res fallback
        const clean = ticker.toUpperCase().replace(/^[A-Z0-9]+:/, '');
        const fmp = `https://images.financialmodelingprep.com/symbol/${clean}.png`;
        if (!list.includes(fmp)) list.push(fmp);

        return list;
    }, [src, ticker]);

    const [idx, setIdx] = useState(0);
    const [failed, setFailed] = useState(false);
    const letter = ticker.slice(0, 1).toUpperCase();

    const handleError = () => {
        if (idx + 1 < candidates.length) {
            setIdx(i => i + 1);
        } else {
            setFailed(true);
        }
    };

    if (failed || candidates.length === 0) {
        return (
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 text-[13px] bg-card border border-border/50 shadow-2xs"
                style={{
                    background: 'hsl(var(--primary) / 0.15)',
                    color: 'hsl(var(--primary))',
                }}
            >
                {letter}
            </div>
        );
    }

    return (
        <img
            key={`${ticker}-${idx}`}
            src={candidates[idx]}
            alt={name || ticker}
            onError={handleError}
            className="w-9 h-9 rounded-xl object-contain flex-shrink-0 bg-card p-0.5 border border-border/50 shadow-2xs"
            loading="lazy"
        />
    );
}

export function TopGainersCard({
    items,
    isLoading,
    isError,
    isStale,
    date,
    onRetry,
}: TopGainersCardProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="market-ranking-card rounded-2xl overflow-hidden border border-border/60 bg-card flex-1 flex flex-col min-h-0 shadow-sm"
        >
            {/* ── Card Header ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs"
                        style={{ background: 'hsl(142 70% 45% / 0.15)' }}
                    >
                        <TrendingUp className="w-4 h-4" style={{ color: 'hsl(142 70% 50%)' }} />
                    </div>
                    <div>
                        <h3 className="text-[14.5px] font-bold tracking-tight text-foreground">Mejores rendimientos</h3>
                        {isStale && (
                            <p className="text-[10.5px] font-medium text-muted-foreground/70">
                                Último cierre {date ? `(${date})` : ''}
                            </p>
                        )}
                    </div>
                </div>

                <Link
                    to="/mercado/mejores-rendimientos"
                    className="text-[12px] font-bold flex items-center gap-0.5 transition-colors text-primary/80 hover:text-primary group"
                >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* ── Card Content / States ── */}
            <div className="p-2.5 flex-1 flex flex-col min-h-0 justify-between">
                {/* 1. State: Loading Skeleton */}
                {isLoading && (
                    <div className="flex-1 flex flex-col justify-between py-1 space-y-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/40 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-3 bg-muted rounded" />
                                    <div className="w-9 h-9 rounded-xl bg-muted" />
                                    <div className="space-y-1">
                                        <div className="w-14 h-4 bg-muted rounded" />
                                        <div className="w-24 h-3 bg-muted/60 rounded" />
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="w-16 h-4 bg-muted rounded ml-auto" />
                                    <div className="w-12 h-3 bg-muted/60 rounded ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. State: Error */}
                {!isLoading && isError && (
                    <div className="flex-1 flex flex-col items-center justify-center p-5 text-center space-y-2">
                        <AlertCircle className="w-7 h-7 mx-auto text-destructive/70" />
                        <p className="text-[13px] font-medium text-muted-foreground">
                            No pudimos cargar los rendimientos.
                        </p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                            </button>
                        )}
                    </div>
                )}

                {/* 3. State: Empty */}
                {!isLoading && !isError && items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center p-5 text-center">
                        <p className="text-[13px] font-medium text-muted-foreground">
                            Todavía no hay datos de rendimiento disponibles.
                        </p>
                    </div>
                )}

                {/* 4. State: Success (Exact 5 rows) */}
                {!isLoading && !isError && items.length > 0 && (
                    <div className="space-y-0.5 flex-1 flex flex-col justify-between min-h-0">
                        {items.slice(0, 5).map((item, index) => {
                            const rank = item.rank || index + 1;
                            const volFormatted = item.volume >= 1_000_000
                                ? `${(item.volume / 1_000_000).toFixed(1)}M`
                                : item.volume >= 1_000
                                    ? `${(item.volume / 1_000).toFixed(1)}K`
                                    : item.volume.toLocaleString();

                            return (
                                <button
                                    key={item.ticker}
                                    type="button"
                                    onClick={() => navigate(`/market?symbol=NASDAQ:${item.ticker}`)}
                                    className="w-full flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-transparent hover:bg-muted/50 transition-all group text-left cursor-pointer bg-transparent"
                                >
                                    {/* Left: Rank + Logo + Ticker/Name */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="text-[13px] font-black w-4 text-center flex-shrink-0"
                                            style={{ color: rank <= 3 ? 'hsl(142 70% 45%)' : 'hsl(var(--muted-foreground) / 0.65)' }}
                                        >
                                            {rank}
                                        </span>

                                        <AssetLogoImg src={item.logoUrl} ticker={item.ticker} name={item.companyName} />

                                        <div className="min-w-0 pr-1">
                                            <p className="text-[14px] font-bold leading-tight group-hover:text-primary transition-colors truncate">
                                                {item.ticker}
                                            </p>
                                            <p className="text-[11.5px] font-medium text-muted-foreground/70 truncate">
                                                {item.companyName || item.ticker}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Price + Volume + Percentage */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[14px] font-bold num text-foreground">
                                            {formatCurrency(item.price, 'USD')}
                                        </p>
                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                            <span className="text-[11px] font-medium text-muted-foreground/60 num">
                                                {volFormatted}
                                            </span>
                                            <div
                                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold num shadow-2xs"
                                                style={{
                                                    background: 'hsl(142 70% 45% / 0.14)',
                                                    color: 'hsl(142 70% 45%)',
                                                }}
                                            >
                                                <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
                                                <span>+{Math.abs(item.changePercent).toFixed(2)}%</span>
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

export default TopGainersCard;
