import { useEffect, useState, useMemo } from 'react';
import {
    Clock,
    Search,
    Sunrise,
    TrendingUp,
    TrendingDown,
    Lock,
    Radio,
    Flame,
    Activity,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SymbolLogo } from '@/components/SymbolLogo';
import type { PremarketAsset, PremarketData } from './PreMarketSection';

const CATEGORIES = [
    { key: 'all', label: 'Todos los activos', icon: Layers },
    { key: 'argentina', label: 'Argentina en Wall Street', icon: Flame },
    { key: 'magnificent7', label: 'Las 7 Magníficas', icon: Sparkles },
    { key: 'indices', label: 'Índices Globales', icon: Activity },
    { key: 'commodities', label: 'Materias Primas', icon: TrendingUp },
    { key: 'crypto', label: 'Criptomonedas', icon: Radio },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

function formatAssetPrice(a: PremarketAsset): string {
    if (a.price == null || !Number.isFinite(a.price)) return 'Sin cotización';
    if (a.format === 'percent') return `${a.price.toFixed(2)}%`;
    return new Intl.NumberFormat('es-AR', {
        ...(a.format === 'currency' ? { style: 'currency', currency: a.currency || 'USD' } : {}),
        maximumFractionDigits: 2,
    }).format(a.price);
}

function formatChange(change: number | null): string {
    if (change == null || !Number.isFinite(change)) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

interface PremarketBriefProps {
    onSelectSymbol?: (symbol: string) => void;
}

export default function PremarketBrief({ onSelectSymbol }: PremarketBriefProps) {
    const [data, setData] = useState<(PremarketData & { scheduledSnapshot?: boolean }) | null>(null);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const res = await apiFetch('/market/premarket', { signal: controller.signal });
                if (!res.ok) throw new Error('Unavailable');
                const next = await res.json();
                if (!controller.signal.aborted) {
                    setData(next);
                    setError(false);
                    setIsLoading(false);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError(true);
                    setIsLoading(false);
                }
            }
        };
        void load();
        const timer = setInterval(load, 60000);
        return () => {
            controller.abort();
            clearInterval(timer);
        };
    }, [retry]);

    // Flatten all assets with category tag
    const allAssets = useMemo(() => {
        if (!data) return [];
        const result: (PremarketAsset & { categoryKey: CategoryKey })[] = [];
        const catKeys: (Exclude<CategoryKey, 'all'>)[] = ['argentina', 'magnificent7', 'indices', 'commodities', 'crypto'];

        for (const cat of catKeys) {
            const list = data[cat] || [];
            for (const item of list) {
                result.push({ ...item, categoryKey: cat });
            }
        }
        return result;
    }, [data]);

    // Filter by query and category
    const filteredAssets = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allAssets.filter((a) => {
            const matchesCat = activeCategory === 'all' || a.categoryKey === activeCategory;
            const matchesQuery = !q || `${a.label} ${a.symbol} ${a.description}`.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
        });
    }, [allAssets, activeCategory, query]);

    const stats = useMemo(() => {
        const total = allAssets.length;
        const withQuote = allAssets.filter((a) => a.price != null).length;
        const up = allAssets.filter((a) => a.change != null && a.change > 0).length;
        const down = allAssets.filter((a) => a.change != null && a.change < 0).length;
        return { total, withQuote, up, down };
    }, [allAssets]);

    const isFrozen = data?.isFrozenPremarket || data?.session?.status !== 'pre-market';
    const sentiment = data?.session?.sentiment || 'neutral';
    const sentimentScore = data?.session?.sentimentScore ?? 50;

    const sentimentBadge = {
        bullish: { label: 'Alcista', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
        bearish: { label: 'Bajista', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
        cautious: { label: 'Cautela', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
        neutral: { label: 'Neutral', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    }[sentiment];

    return (
        <section className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12">
            {/* ─── Hero & Market Status Banner ─────────────────────────── */}
            <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                                <Sunrise className="w-3.5 h-3.5" /> Finix · Pre-Market
                            </span>

                            {isFrozen ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    <Lock className="w-3.5 h-3.5" /> Pre-Market Finalizado (10:30 hs)
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                                    <Radio className="w-3.5 h-3.5" /> Sesión en Vivo
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Informe Oficial de Pre-Apertura
                        </h1>

                        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {isFrozen
                                ? 'La rueda regular se encuentra activa. Se conserva la última cotización oficial del pre-market antes de la apertura (10:30 hs ART), garantizando la referencia exacta previa a la campana.'
                                : 'Seguimiento en tiempo real de los futuros de Wall Street, ADRs argentinos, Big Tech y materias primas antes del toque de campana a las 10:30 hs ART.'}
                        </p>
                    </div>

                    {/* Right schedule box */}
                    <div className="flex items-center gap-4 bg-background/80 border border-border/60 rounded-2xl p-4 shrink-0 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Horario de Corte Oficial
                            </p>
                            <p className="text-lg font-black text-foreground">
                                10:20 - 10:30 <span className="text-xs font-semibold text-primary">ART</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {data?.updatedAt
                                    ? `Último registro: ${new Date(data.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`
                                    : 'Sincronizado con Wall Street'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Macro Sentiment & KPI Row ───────────────────────── */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-5 border-t border-border/50">
                    {/* Sentiment Bar */}
                    <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/60 p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-primary" /> Clima Macro de Pre-Apertura
                            </span>
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${sentimentBadge.color}`}>
                                {sentimentBadge.label} ({sentimentScore}%)
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden my-1.5">
                            <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                    sentiment === 'bullish'
                                        ? 'bg-emerald-500'
                                        : sentiment === 'bearish'
                                        ? 'bg-rose-500'
                                        : sentiment === 'cautious'
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(10, sentimentScore))}%` }}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground font-medium line-clamp-1 mt-1">
                            {data?.session?.sentimentSummary || 'Futuros y cotizaciones operando según expectativas.'}
                        </p>
                    </div>

                    {/* Stat Up */}
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-emerald-500 tabular-nums">{data ? stats.up : '—'}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-0.5">Activos en Alza</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Stat Down */}
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-rose-500 tabular-nums">{data ? stats.down : '—'}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-0.5">Activos en Baja</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <ArrowDownRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Top Movers Section (Gainers & Losers) ───────────────── */}
            {data && ((data.topGainers && data.topGainers.length > 0) || (data.topLosers && data.topLosers.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Gainers */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" /> Mayores Subas en Pre-Market
                            </h3>
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                Top 5
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {data.topGainers?.slice(0, 5).map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => onSelectSymbol?.(a.symbol)}
                                    className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center p-2.5 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-emerald-500/40 transition-all text-left group shadow-2xs"
                                >
                                    <div className="flex items-center gap-2 mb-0 sm:mb-1.5 min-w-0">
                                        <SymbolLogo symbol={a.symbol} size={22} className="shrink-0" />
                                        <span className="text-xs font-black truncate group-hover:text-emerald-500 transition-colors">
                                            {a.symbol.split(':').pop()}
                                        </span>
                                    </div>
                                    <div className="text-right sm:text-left">
                                        <p className="text-xs font-bold tabular-nums text-foreground">{formatAssetPrice(a)}</p>
                                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatChange(a.change)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Top Losers */}
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingDown className="w-4 h-4" /> Mayores Bajas en Pre-Market
                            </h3>
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                Top 5
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {data.topLosers?.slice(0, 5).map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => onSelectSymbol?.(a.symbol)}
                                    className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center p-2.5 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-rose-500/40 transition-all text-left group shadow-2xs"
                                >
                                    <div className="flex items-center gap-2 mb-0 sm:mb-1.5 min-w-0">
                                        <SymbolLogo symbol={a.symbol} size={22} className="shrink-0" />
                                        <span className="text-xs font-black truncate group-hover:text-rose-500 transition-colors">
                                            {a.symbol.split(':').pop()}
                                        </span>
                                    </div>
                                    <div className="text-right sm:text-left">
                                        <p className="text-xs font-bold tabular-nums text-foreground">{formatAssetPrice(a)}</p>
                                        <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                                            {formatChange(a.change)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Controls: Search & Category Pills ───────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = activeCategory === cat.key;
                        const count = cat.key === 'all' ? allAssets.length : allAssets.filter((a) => a.categoryKey === cat.key).length;

                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setActiveCategory(cat.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/50'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.label}
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px] sm:max-w-xs shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar activo o símbolo..."
                        className="w-full bg-card border border-border/60 focus:border-primary rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
                    />
                </div>
            </div>

            {/* ─── Error / Loading States ─────────────────────────────── */}
            {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="w-4 h-4" />
                        <span>No se pudo sincronizar la última cotización del pre-market. Se conservan los datos previos.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRetry((n) => n + 1)}
                        className="font-bold underline hover:no-underline text-destructive"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {isLoading && !data && (
                <div className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted-foreground">Cargando cotizaciones oficiales de pre-apertura...</p>
                </div>
            )}

            {/* ─── Perfectly Distributed Assets Grid (Zero Blank Spaces) ── */}
            {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {filteredAssets.map((a) => {
                        const isUp = a.change != null && a.change >= 0;
                        const isNull = a.change == null;

                        return (
                            <div
                                key={a.id}
                                onClick={() => onSelectSymbol?.(a.symbol)}
                                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/60 bg-card hover:bg-card/90 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                {/* Card Header */}
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <SymbolLogo symbol={a.symbol} size={32} className="shrink-0 rounded-lg" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-black text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                        {a.symbol.split(':').pop() || a.symbol}
                                                    </span>
                                                    <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                                                        PRE
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                                                    {a.label}
                                                </p>
                                            </div>
                                        </div>

                                        {/* % Change Badge */}
                                        <span
                                            className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 tabular-nums flex items-center gap-0.5 ${
                                                isNull
                                                    ? 'bg-muted text-muted-foreground'
                                                    : isUp
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                            }`}
                                        >
                                            {isNull ? '—' : isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {formatChange(a.change)}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mb-3">
                                        {a.description}
                                    </p>
                                </div>

                                {/* Card Footer: Premarket Price & Reference */}
                                <div className="pt-2.5 border-t border-border/40 flex items-baseline justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Cotización Pre-Market
                                        </p>
                                        <p className="text-base font-black tabular-nums text-foreground mt-0.5">
                                            {formatAssetPrice(a)}
                                        </p>
                                    </div>

                                    {a.regularPrice != null && a.regularPrice !== a.price && (
                                        <div className="text-right">
                                            <p className="text-[9.5px] font-medium text-muted-foreground/70">
                                                Rueda regular
                                            </p>
                                            <p className="text-xs font-semibold tabular-nums text-muted-foreground">
                                                ${a.regularPrice.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                data && (
                    <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40">
                        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold text-muted-foreground">
                            No se encontraron activos para "{query}".
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setActiveCategory('all');
                            }}
                            className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                            Restablecer filtros
                        </button>
                    </div>
                )
            )}

            {/* Legal / Institutional note */}
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-[11.5px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                    Las cotizaciones mostradas reflejan exclusivamente la sesión de pre-apertura previa al toque de campana (10:30 hs ART).
                    Al abrir la rueda regular, Finix preserva intactas las últimas cotizaciones del pre-market para auditoría y consulta del usuario.
                </p>
            </div>
        </section>
    );
}
