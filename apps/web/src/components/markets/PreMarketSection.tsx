import { useEffect, useRef, useState } from 'react';
import {
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Flame,
    RefreshCw,
    Zap,
    Building2,
    Coins,
    Info,
    ChevronRight,
    Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SymbolLogo } from '@/components/SymbolLogo';
import TradingViewTickerTape from '@/components/TradingViewTickerTape';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferencesStore';

export interface PremarketAsset {
    id: string;
    symbol: string;
    label: string;
    description: string;
    format: 'currency' | 'number' | 'percent';
    currency?: 'ARS' | 'USD';
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable: boolean;
}

export interface PremarketData {
    updatedAt: string;
    isFrozenPremarket?: boolean;
    session: {
        status: 'pre-market' | 'regular' | 'post-market' | 'closed';
        label: string;
        nextBell: string;
        secondsToOpen: number;
        sentiment: 'bullish' | 'neutral' | 'cautious' | 'bearish';
        sentimentScore: number;
        sentimentSummary: string;
    };
    topGainers?: PremarketAsset[];
    topLosers?: PremarketAsset[];
    indices: PremarketAsset[];
    commodities: PremarketAsset[];
    magnificent7: PremarketAsset[];
    argentina: PremarketAsset[];
    crypto: PremarketAsset[];
}

interface PreMarketSectionProps {
    onSelectSymbol?: (symbol: string) => void;
}

function toShortSymbol(symbol: string) {
    const clean = (symbol || '').trim().toUpperCase();
    if (!clean) return '';
    return clean.includes(':') ? clean.split(':').pop() || clean : clean;
}

function formatValue(item: PremarketAsset) {
    if (item.price === null || Number.isNaN(item.price)) {
        return '---';
    }

    if (item.format === 'percent') {
        return `${item.price.toFixed(2)}%`;
    }

    if (item.format === 'number') {
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(item.price);
    }

    const currencyCode = item.currency || 'USD';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(item.price);
}

function formatChange(change: number | null) {
    if (change === null || Number.isNaN(change)) {
        return '0.00%';
    }
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

/* ─────────────────────────────────────────────
   Asset Card – large, centered, premium
───────────────────────────────────────────── */
function AssetCard({
    item,
    tag,
    onSelect,
    frozen,
}: {
    item: PremarketAsset;
    tag?: string;
    onSelect?: (symbol: string) => void;
    frozen?: boolean;
}) {
    const positive = (item.change ?? 0) > 0;
    const negative = (item.change ?? 0) < 0;

    return (
        <div
            onClick={() => onSelect?.(item.symbol)}
            className="group relative rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md p-5 transition-all duration-200 hover:border-primary/50 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 cursor-pointer flex flex-col gap-4"
        >
            {/* Frozen badge */}
            {frozen && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" /> Fijado
                </span>
            )}

            {/* Header: logo + label */}
            <div className="flex items-center gap-3">
                <SymbolLogo symbol={item.symbol} size={40} className="shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {item.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-secondary/80 px-1.5 py-0.5 rounded">
                            {toShortSymbol(item.symbol)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
                        {item.description}
                    </p>
                </div>
            </div>

            {/* Price + change */}
            <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/30">
                <div>
                    <span className="text-3xl font-mono font-black tracking-tight text-foreground leading-none">
                        {formatValue(item)}
                    </span>
                    {tag && (
                        <span className="block text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-1.5">
                            {tag}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <span
                        className={cn(
                            'text-sm font-mono font-black px-3 py-1 rounded-xl flex items-center gap-1',
                            positive
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : negative
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-secondary text-muted-foreground'
                        )}
                    >
                        {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : negative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {formatChange(item.change)}
                    </span>
                    <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-0.5">
                        Ver gráfico <ChevronRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Compact rank card for gainers/losers
───────────────────────────────────────────── */
function RankCard({
    item,
    rank,
    variant,
    onSelect,
}: {
    item: PremarketAsset;
    rank: number;
    variant: 'gainer' | 'loser';
    onSelect?: (symbol: string) => void;
}) {
    const isGainer = variant === 'gainer';
    const positive = (item.change ?? 0) > 0;
    const negative = (item.change ?? 0) < 0;

    return (
        <div
            onClick={() => onSelect?.(item.symbol)}
            className={cn(
                'group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
                isGainer
                    ? 'border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-emerald-500/10'
                    : 'border-rose-500/25 bg-rose-500/5 hover:border-rose-500/50 hover:bg-rose-500/10 hover:shadow-rose-500/10'
            )}
        >
            {/* Rank number */}
            <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-black',
                isGainer ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            )}>
                {rank}
            </span>

            {/* Logo */}
            <SymbolLogo symbol={item.symbol} size={36} className="shrink-0" />

            {/* Label + symbol */}
            <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {item.label}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground uppercase mt-0.5">
                    {toShortSymbol(item.symbol)}
                </div>
            </div>

            {/* Price & change */}
            <div className="text-right shrink-0">
                <div className="text-base font-mono font-black text-foreground leading-none">
                    {formatValue(item)}
                </div>
                <div className={cn(
                    'text-sm font-mono font-bold mt-1 flex items-center justify-end gap-0.5',
                    isGainer ? 'text-emerald-400' : 'text-rose-400'
                )}>
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : negative ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                    {formatChange(item.change)}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Section header
───────────────────────────────────────────── */
function SectionHeader({
    icon,
    iconColor,
    title,
    subtitle,
    badge,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle: string;
    badge?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs mt-0.5', iconColor)}>
                {icon}
            </span>
            <div>
                <h3 className="font-heading font-extrabold text-xl text-foreground flex items-center gap-2 flex-wrap leading-tight">
                    {title}
                    {badge}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function PreMarketSection({ onSelectSymbol }: PreMarketSectionProps) {
    const [data, setData] = useState<PremarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<'all' | 'indices' | 'commodities' | 'mag7' | 'argentina' | 'crypto'>('all');
    const [countdown, setCountdown] = useState<string>('00:00:00');
    const lastUpdatedRef = useRef<string | null>(null);

    const { theme } = usePreferencesStore();
    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const widgetTheme = isLight ? 'light' : 'dark';

    const fetchPremarket = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const res = await apiFetch(`/market/premarket?_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                lastUpdatedRef.current = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            }
        } catch (err) {
            console.error('Error fetching premarket data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Refresh every 60 seconds (not every 1s, not every 30s)
    useEffect(() => {
        fetchPremarket(true);
        const interval = setInterval(() => fetchPremarket(false), 60_000);
        return () => clearInterval(interval);
    }, []);

    // Countdown effect – only the clock ticks every second, NOT the price fetch
    useEffect(() => {
        if (!data?.session?.nextBell) return;

        const updateCountdown = () => {
            const target = new Date(data.session.nextBell).getTime();
            const now = Date.now();
            const diff = Math.max(0, target - now);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateCountdown();
        const countdownTimer = setInterval(updateCountdown, 1000);
        return () => clearInterval(countdownTimer);
    }, [data?.session?.nextBell]);

    const isPreMarket = data?.session?.status === 'pre-market';
    const isRegular = data?.session?.status === 'regular';
    const isFrozen = Boolean(data?.isFrozenPremarket);

    const sentimentColor =
        data?.session?.sentiment === 'bullish' ? 'text-emerald-400' :
            data?.session?.sentiment === 'bearish' ? 'text-rose-400' :
                'text-amber-400';

    const sentimentBg =
        data?.session?.sentiment === 'bullish' ? 'bg-emerald-500/10 border-emerald-500/30' :
            data?.session?.sentiment === 'bearish' ? 'bg-rose-500/10 border-rose-500/30' :
                'bg-amber-500/10 border-amber-500/30';

    const sessionStatusColor =
        isPreMarket ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
            isRegular ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' :
                'text-blue-400 border-blue-500/30 bg-blue-500/10';

    const sessionDotColor =
        isPreMarket ? 'bg-amber-500' : isRegular ? 'bg-emerald-500' : 'bg-blue-500';

    return (
        <div className="space-y-8">
            {/* ── TradingView Ticker Tape ── */}
            <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm p-1">
                <TradingViewTickerTape
                    symbols={[
                        { proName: "AMEX:SPY", title: "S&P 500 ETF" },
                        { proName: "NASDAQ:QQQ", title: "Nasdaq 100 ETF" },
                        { proName: "OANDA:XAUUSD", title: "Oro (Gold)" },
                        { proName: "TVC:USOIL", title: "Petróleo WTI" },
                        { proName: "NASDAQ:NVDA", title: "NVIDIA" },
                        { proName: "NASDAQ:AAPL", title: "Apple" },
                        { proName: "NASDAQ:TSLA", title: "Tesla" },
                        { proName: "NYSE:YPF", title: "YPF ADR" },
                        { proName: "NASDAQ:MELI", title: "MercadoLibre" },
                        { proName: "NASDAQ:GGAL", title: "Galicia ADR" },
                        { proName: "NYSE:VIST", title: "Vista Energy" },
                        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
                    ]}
                    colorTheme={widgetTheme}
                />
            </div>

            {/* ── Hero Status Bar ── */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-8 backdrop-blur-xl shadow-2xl">
                {/* Background glow */}
                <div className={cn(
                    'absolute inset-0 -z-10 opacity-20 blur-3xl rounded-3xl',
                    isPreMarket ? 'bg-amber-500' : isRegular ? 'bg-emerald-500' : 'bg-blue-500'
                )} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Left: title + status */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', sessionDotColor)} />
                                <span className={cn('relative inline-flex rounded-full h-3.5 w-3.5', sessionDotColor)} />
                            </span>
                            <Badge variant="outline" className={cn('text-sm font-bold uppercase tracking-wider px-3 py-1.5', sessionStatusColor)}>
                                {data?.session?.label || 'Pre-Market Wall Street'}
                            </Badge>
                            {isFrozen && (
                                <Badge variant="outline" className="text-xs font-bold text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1 px-2.5 py-1">
                                    <Lock className="w-3 h-3" /> Precios fijados al cierre pre-market
                                </Badge>
                            )}
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-heading font-black tracking-tight text-foreground">
                            Monitor de Pre-Apertura
                        </h2>

                        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                            {data?.session?.sentimentSummary ||
                                'Datos en vivo de futuros, materias primas clave (oro y petróleo), las 7 Magníficas y los principales ADRs argentinos antes de la campana.'}
                        </p>

                        <p className="text-sm text-muted-foreground/70">
                            Horario EE. UU. (04:00 – 09:30 ET) · Argentina (05:00 – 10:30 ART)
                            {lastUpdatedRef.current && (
                                <span className="ml-2 text-muted-foreground/50">· Actualizado {lastUpdatedRef.current}</span>
                            )}
                        </p>
                    </div>

                    {/* Right: widgets */}
                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                        {/* Countdown */}
                        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 flex items-center gap-4 shadow-sm min-w-[170px]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Clock className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {isRegular ? 'Cierre de Sesión en' : 'Apertura en'}
                                </p>
                                <p className="text-3xl font-mono font-black text-foreground tracking-tight leading-none mt-1">
                                    {countdown}
                                </p>
                            </div>
                        </div>

                        {/* Sentiment Meter */}
                        {data?.session && (
                            <div className={cn(
                                'rounded-2xl border p-4 flex items-center gap-4 shadow-sm min-w-[180px]',
                                sentimentBg,
                                'bg-background/70'
                            )}>
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-xl font-bold',
                                    data.session.sentiment === 'bullish' ? 'bg-emerald-500/15 text-emerald-400' :
                                        data.session.sentiment === 'bearish' ? 'bg-rose-500/15 text-rose-400' :
                                            'bg-amber-500/15 text-amber-400'
                                )}>
                                    {data.session.sentiment === 'bullish' ? <TrendingUp className="w-6 h-6" /> :
                                        data.session.sentiment === 'bearish' ? <TrendingDown className="w-6 h-6" /> :
                                            <Activity className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Termómetro
                                    </p>
                                    <p className={cn('text-xl font-bold capitalize leading-none mt-1', sentimentColor)}>
                                        {data.session.sentiment === 'bullish' ? 'Alcista' :
                                            data.session.sentiment === 'bearish' ? 'Bajista' :
                                                'Mixto'}
                                    </p>
                                    <p className={cn('text-sm font-mono font-bold', sentimentColor)}>
                                        ({data.session.sentimentScore}%)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchPremarket(true)}
                            disabled={loading}
                            className="rounded-2xl h-12 w-12 shrink-0"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin text-primary')} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Category Filter Chips ── */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'Ver Todo', count: null },
                    { id: 'indices', label: 'Índices & Futuros', count: data?.indices.length },
                    { id: 'commodities', label: 'Oro & Petróleo', count: data?.commodities.length },
                    { id: 'mag7', label: 'Las 7 Magníficas', count: data?.magnificent7.length },
                    { id: 'argentina', label: 'Top Argentina (ADRs)', count: data?.argentina.length },
                    { id: 'crypto', label: 'Cripto 24/7', count: data?.crypto.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterCategory(tab.id as any)}
                        className={cn(
                            'px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border',
                            filterCategory === tab.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                                : 'bg-card/60 text-muted-foreground border-border/40 hover:text-foreground hover:bg-card/90'
                        )}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count !== undefined && (
                            <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded-full font-mono',
                                filterCategory === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════
                SECTION 0 (always shown): INDICES FIRST
            ════════════════════════════════════ */}
            {(filterCategory === 'all' || filterCategory === 'indices') && (
                <div className="space-y-4">
                    <SectionHeader
                        icon={<Activity className="w-5 h-5" />}
                        iconColor="bg-emerald-500/10 text-emerald-500"
                        title="Índices Principales y Futuros de Wall Street"
                        subtitle="S&P 500, Nasdaq 100, Dow Jones, Russell 2000 y termómetro de volatilidad VIX"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data?.indices.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Índice / Macro"
                                onSelect={onSelectSymbol}
                                frozen={isFrozen}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                SECTION 1: TOP 5 GAINERS & LOSERS S&P 500 PREMARKET
            ════════════════════════════════════ */}
            {filterCategory === 'all' && data?.topGainers && data?.topLosers && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gainers */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <TrendingUp className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-xl text-foreground leading-tight">
                                    Top 5 Alcistas
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Las que más suben en pre-market hoy
                                    {isFrozen && <span className="ml-1.5 text-amber-500 font-semibold">(fijados al cierre pre-market)</span>}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {data.topGainers.map((item, i) => (
                                <RankCard
                                    key={item.id}
                                    item={item}
                                    rank={i + 1}
                                    variant="gainer"
                                    onSelect={onSelectSymbol}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Losers */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                <TrendingDown className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-xl text-foreground leading-tight">
                                    Top 5 Bajistas
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Las que más caen en pre-market hoy
                                    {isFrozen && <span className="ml-1.5 text-amber-500 font-semibold">(fijados al cierre pre-market)</span>}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {data.topLosers.map((item, i) => (
                                <RankCard
                                    key={item.id}
                                    item={item}
                                    rank={i + 1}
                                    variant="loser"
                                    onSelect={onSelectSymbol}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                SECTION 2: Las 7 Magníficas
            ════════════════════════════════════ */}
            {(filterCategory === 'all' || filterCategory === 'mag7') && (
                <div className="space-y-4">
                    <SectionHeader
                        icon={<Zap className="w-5 h-5" />}
                        iconColor="bg-emerald-500/10 text-emerald-500"
                        title="Las 7 Magníficas (Big Tech de Wall Street)"
                        subtitle="Los gigantes tecnológicos que mueven el 30% del S&P 500 y marcan el pulso pre-apertura"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data?.magnificent7.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Magnificent 7"
                                onSelect={onSelectSymbol}
                                frozen={isFrozen}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                SECTION 3: Top Argentina (ADRs)
            ════════════════════════════════════ */}
            {(filterCategory === 'all' || filterCategory === 'argentina') && (
                <div className="space-y-4">
                    <SectionHeader
                        icon={<Building2 className="w-5 h-5" />}
                        iconColor="bg-blue-500/10 text-blue-500"
                        title="Líderes de Argentina en Wall Street (ADRs)"
                        subtitle="YPF, MercadoLibre, Galicia y Vista: cotizan en dólares en Nueva York antes de que abra el mercado porteño a las 11:00 hs"
                        badge={
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/25">
                                Anticipo Apertura BCBA
                            </Badge>
                        }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data?.argentina.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="ADR Argentina"
                                onSelect={onSelectSymbol}
                                frozen={isFrozen}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                SECTION 4: Commodities
            ════════════════════════════════════ */}
            {(filterCategory === 'all' || filterCategory === 'commodities') && (
                <div className="space-y-4">
                    <SectionHeader
                        icon={<Flame className="w-5 h-5" />}
                        iconColor="bg-amber-500/10 text-amber-500"
                        title="Commodities Clave: Oro & Petróleo"
                        subtitle="Metales preciosos y energía: activos de cobertura e inflación en premarket"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data?.commodities.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Commodity"
                                onSelect={onSelectSymbol}
                                frozen={isFrozen}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                SECTION 5: Cripto 24/7
            ════════════════════════════════════ */}
            {(filterCategory === 'all' || filterCategory === 'crypto') && (
                <div className="space-y-4">
                    <SectionHeader
                        icon={<Coins className="w-5 h-5" />}
                        iconColor="bg-purple-500/10 text-purple-500"
                        title="Criptomonedas 24/7 (Termómetro de Liquidez Nocturna)"
                        subtitle="Bitcoin y Ethereum operan sin descanso y anticipan el apetito por riesgo antes de la campana"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data?.crypto.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Cripto"
                                onSelect={onSelectSymbol}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Educational Info Card ── */}
            <div className="rounded-3xl border border-border/50 bg-secondary/20 p-7 flex flex-col md:flex-row items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-6 h-6" />
                </div>
                <div className="space-y-2 leading-relaxed">
                    <p className="font-bold text-lg text-foreground">
                        ¿Cómo usar el Pre-Market para operar mejor en Argentina?
                    </p>
                    <p className="text-sm text-muted-foreground">
                        El horario de <strong>Pre-Market en EE. UU. (05:00 a 10:30 hs de Argentina)</strong> permite detectar las tendencias con las que abrirá Wall Street.
                        Si los ADRs argentinos (como <strong>YPF, MELI o GGAL</strong>) suben en Nueva York durante el pre-mercado, anticipan la dirección de los <strong>CEDEARs y acciones del Merval</strong> cuando la Bolsa de Buenos Aires (BYMA) abre sus puertas a las <strong>11:00 hs</strong>.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-5 text-foreground/80 font-mono text-xs">
                        <span>🔔 05:00 ART: Inicio Pre-Market USA</span>
                        <span>🔔 10:30 ART: Campana de Wall Street</span>
                        <span>🔔 11:00 ART: Apertura Bolsa de Buenos Aires</span>
                    </div>
                    {isFrozen && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-500">
                            <Lock className="w-4 h-4" />
                            Los precios mostrados son los del cierre del pre-market. No se actualizan durante la sesión regular para no mezclar contextos.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
