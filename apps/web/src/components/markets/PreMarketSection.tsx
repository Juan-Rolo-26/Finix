import { useEffect, useState } from 'react';
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
    session: {
        status: 'pre-market' | 'regular' | 'post-market' | 'closed';
        label: string;
        nextBell: string;
        secondsToOpen: number;
        sentiment: 'bullish' | 'neutral' | 'cautious' | 'bearish';
        sentimentScore: number;
        sentimentSummary: string;
    };
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
            minimumFractionDigits: item.price < 10 ? 2 : 2,
            maximumFractionDigits: 2,
        }).format(item.price);
    }

    const currencyCode = item.currency || 'USD';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: item.price < 10 ? 2 : 2,
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

function AssetCard({
    item,
    tag,
    onSelect,
}: {
    item: PremarketAsset;
    tag?: string;
    onSelect?: (symbol: string) => void;
}) {
    const positive = (item.change ?? 0) > 0;
    const negative = (item.change ?? 0) < 0;

    return (
        <div
            onClick={() => onSelect?.(item.symbol)}
            className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 transition-all duration-200 hover:border-primary/50 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col justify-between gap-3"
        >
            <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <SymbolLogo symbol={item.symbol} size={32} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {item.label}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-secondary/80 px-1.5 py-0.5 rounded">
                                {toShortSymbol(item.symbol)}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {item.description}
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                        positive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                            : negative
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                                : 'bg-secondary text-muted-foreground border-border/40'
                    )}
                >
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : negative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                </div>
            </div>

            <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/30">
                <div>
                    <span className="text-xl font-mono font-black tracking-tight text-foreground">
                        {formatValue(item)}
                    </span>
                    {tag && (
                        <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                            {tag}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span
                        className={cn(
                            'text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                            positive
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : negative
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-secondary text-muted-foreground'
                        )}
                    >
                        {formatChange(item.change)}
                    </span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-0.5">
                        Ver gráfico <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function PreMarketSection({ onSelectSymbol }: PreMarketSectionProps) {
    const [data, setData] = useState<PremarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<'all' | 'indices' | 'commodities' | 'mag7' | 'argentina' | 'crypto'>('all');
    const [countdown, setCountdown] = useState<string>('00:00:00');

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
            }
        } catch (err) {
            console.error('Error fetching premarket data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPremarket(true);
        const interval = setInterval(() => fetchPremarket(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Countdown effect
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

    const isSessionOpen = data?.session?.status === 'pre-market';
    const isRegular = data?.session?.status === 'regular';

    return (
        <div className="space-y-6">
            {/* Top TradingView Ticker Tape for Pre-Market Highlights */}
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

            {/* Premarket Status & Countdown Hero Bar */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-card/80 via-card/50 to-primary/5 p-6 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="relative flex h-3 w-3">
                                <span className={cn(
                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    isSessionOpen ? "bg-amber-400" : isRegular ? "bg-emerald-400" : "bg-blue-400"
                                )}></span>
                                <span className={cn(
                                    "relative inline-flex rounded-full h-3 w-3",
                                    isSessionOpen ? "bg-amber-500" : isRegular ? "bg-emerald-500" : "bg-blue-500"
                                )}></span>
                            </span>

                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs font-bold uppercase tracking-wider px-2.5 py-1",
                                    isSessionOpen
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                        : isRegular
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                            : "bg-primary/10 text-primary border-primary/30"
                                )}
                            >
                                {data?.session?.label || 'Pre-Market Wall Street'}
                            </Badge>

                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                Horario EE. UU. (04:00 - 09:30 ET) · Argentina (05:00 - 10:30 ART)
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
                            Monitor de Pre-Apertura
                        </h2>

                        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                            {data?.session?.sentimentSummary ||
                                'Datos en vivo de futuros, materias primas clave (oro y petróleo), las 7 Magníficas y los principales ADRs argentinos antes de la campana.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                        {/* Countdown to Opening Bell */}
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 flex items-center gap-3.5 shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Clock className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {isRegular ? 'Cierre de Sesión en' : 'Campana de Apertura en'}
                                </p>
                                <p className="text-2xl font-mono font-black text-foreground tracking-tight">
                                    {countdown}
                                </p>
                            </div>
                        </div>

                        {/* Sentiment Meter */}
                        {data?.session && (
                            <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 flex items-center gap-3.5 shadow-sm">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl font-bold",
                                    data.session.sentiment === 'bullish'
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : data.session.sentiment === 'bearish'
                                            ? "bg-rose-500/10 text-rose-400"
                                            : "bg-amber-500/10 text-amber-400"
                                )}>
                                    {data.session.sentiment === 'bullish' ? <TrendingUp className="w-5 h-5" /> : data.session.sentiment === 'bearish' ? <TrendingDown className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Termómetro Premarket
                                    </p>
                                    <p className={cn(
                                        "text-lg font-bold capitalize",
                                        data.session.sentiment === 'bullish'
                                            ? "text-emerald-400"
                                            : data.session.sentiment === 'bearish'
                                                ? "text-rose-400"
                                                : "text-amber-400"
                                    )}>
                                        {data.session.sentiment === 'bullish' ? 'Alcista' : data.session.sentiment === 'bearish' ? 'Bajista' : 'Mixto / Cautela'} ({data.session.sentimentScore}%)
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchPremarket(true)}
                            disabled={loading}
                            className="rounded-2xl h-11 w-11 shrink-0"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-primary")} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'Ver Todo', count: null },
                    { id: 'indices', label: 'Índices & Futuros', count: data?.indices.length },
                    { id: 'commodities', label: 'Oro & Petróleo', count: data?.commodities.length },
                    { id: 'mag7', label: 'Las 7 Magníficas', count: data?.magnificent7.length },
                    { id: 'argentina', label: 'Top 4 Argentina (ADRs)', count: data?.argentina.length },
                    { id: 'crypto', label: 'Cripto 24/7', count: data?.crypto.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterCategory(tab.id as any)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border",
                            filterCategory === tab.id
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                : "bg-card/60 text-muted-foreground border-border/40 hover:text-foreground hover:bg-card/90"
                        )}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count !== undefined && (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                filterCategory === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* SECTION 1: Las 7 Magníficas de Wall Street */}
            {(filterCategory === 'all' || filterCategory === 'mag7') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-black text-xs">
                                <Zap className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-base text-foreground flex items-center gap-2">
                                    Las 7 Magníficas (Big Tech de Wall Street)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Los gigantes tecnológicos que mueven el 30% del S&P 500 y marcan el pulso pre-apertura
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {data?.magnificent7.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Magnificent 7"
                                onSelect={onSelectSymbol}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 2: Top 4 Líderes de Argentina (ADRs) */}
            {(filterCategory === 'all' || filterCategory === 'argentina') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-black text-xs">
                                <Building2 className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-base text-foreground flex items-center gap-2">
                                    Líderes de Argentina en Wall Street (ADRs)
                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/25">
                                        Anticipo Apertura BCBA
                                    </Badge>
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    YPF, MercadoLibre, Galicia y Vista: cotizan en dólares en Nueva York antes de que abra el mercado porteño a las 11:00 hs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {data?.argentina.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="ADR Argentina"
                                onSelect={onSelectSymbol}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 3: Commodities Clave (Oro & Petróleo) */}
            {(filterCategory === 'all' || filterCategory === 'commodities') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-black text-xs">
                                <Flame className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-base text-foreground">
                                    Commodities Clave: Oro & Petróleo
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Metales preciosos y energía: activos de cobertura e inflación en premarket
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
                        {data?.commodities.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Commodity"
                                onSelect={onSelectSymbol}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 4: Índices y Futuros Globales */}
            {(filterCategory === 'all' || filterCategory === 'indices') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-black text-xs">
                                <Activity className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-base text-foreground">
                                    Índices Principales y Futuros de Wall Street
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    S&P 500, Nasdaq 100, Dow Jones, Russell 2000 y termómetro de volatilidad VIX
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {data?.indices.map((item) => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                tag="Índice / Macro"
                                onSelect={onSelectSymbol}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 5: Cripto 24/7 Macro Indicator */}
            {(filterCategory === 'all' || filterCategory === 'crypto') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 font-black text-xs">
                                <Coins className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="font-heading font-extrabold text-base text-foreground">
                                    Criptomonedas 24/7 (Termómetro de Liquidez Nocturna)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Bitcoin y Ethereum operan sin descanso y anticipan el apetito por riesgo antes de la campana
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
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

            {/* Educational Info Card: El Puente Premarket */}
            <div className="rounded-3xl border border-border/50 bg-secondary/20 p-6 flex flex-col md:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-bold text-sm text-foreground">
                        ¿Cómo usar el Pre-Market para operar mejor en Argentina?
                    </p>
                    <p>
                        El horario de <strong>Pre-Market en EE. UU. (05:00 a 10:30 hs de Argentina)</strong> permite detectar las tendencias con las que abrirá Wall Street.
                        Si los ADRs argentinos (como <strong>YPF, MELI o GGAL</strong>) suben en Nueva York durante el pre-mercado, anticipan la dirección de los <strong>CEDEARs y acciones del Merval</strong> cuando la Bolsa de Buenos Aires (BYMA) abre sus puertas a las <strong>11:00 hs</strong>.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4 text-foreground/80 font-mono text-[11px]">
                        <span>🔔 05:00 ART: Inicio Pre-Market USA</span>
                        <span>🔔 10:30 ART: Campana de Wall Street</span>
                        <span>🔔 11:00 ART: Apertura Bolsa de Buenos Aires</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
