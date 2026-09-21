import { useState, useEffect, useMemo } from 'react';
import {
    Flame,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Search,
    LayoutGrid,
    Grid3X3,
    ArrowUpRight,
    Info,
    CheckCircle2,
    AlertCircle,
    Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SymbolLogo } from '@/components/SymbolLogo';
import MarketGeneralHeatmap from './MarketGeneralHeatmap';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface HeatmapItem {
    symbol: string;
    ticker: string;
    name: string;
    sector: string;
    rawSector: string;
    price: number;
    change1D: number;
    change1W: number;
    marketCap: number;
    volume: number;
    rsi: number;
    rsiState: string;
    macd: number;
    signal: number;
    hist: number;
    macdState: string;
    totalScore: number;
    signalType: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    signalLabel: string;
    color: string;
    bgGradient: string;
    borderHover: string;
}

export interface HeatmapSummary {
    totalCount: number;
    timeframe: string;
    updatedAt: string;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    bullishPct: number;
    bearishPct: number;
    neutralPct: number;
    strongBuyCount: number;
    buyCount: number;
    sellCount: number;
    strongSellCount: number;
    sentiment: 'FUERTE ALCISTA' | 'ALCISTA' | 'NEUTRAL' | 'BAJISTA' | 'FUERTE BAJISTA';
}

interface MarketHeatmapProps {
    onSelectSymbol?: (symbol: string) => void;
}

export type HeatmapMode = 'general' | 'macd' | 'rsi';
type FilterSignal = 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
type SortOption = 'marketCap' | 'scoreDesc' | 'scoreAsc' | 'rsiDesc' | 'rsiAsc' | 'change1WDesc' | 'change1WAsc';
type ViewDisplay = 'cards' | 'tiles';

function formatMoney(n: number) {
    if (!n) return '$0.00';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMarketCap(cap: number) {
    if (!cap) return '-';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
    return `$${cap.toLocaleString()}`;
}

export default function MarketHeatmap({ onSelectSymbol }: MarketHeatmapProps) {
    const [items, setItems] = useState<HeatmapItem[]>([]);
    const [summary, setSummary] = useState<HeatmapSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Main Active Heatmap Mode: 'general' | 'macd' | 'rsi'
    const [activeMode, setActiveMode] = useState<HeatmapMode>('general');

    // Display mode for technical cards: 'cards' | 'tiles'
    const [viewDisplay, setViewDisplay] = useState<ViewDisplay>('cards');

    // Filters and controls
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSignal, setSelectedSignal] = useState<FilterSignal>('ALL');
    const [selectedSector, setSelectedSector] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<SortOption>('marketCap');
    const [showInfoModal, setShowInfoModal] = useState(false);

    const fetchData = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/market/heatmap/sp500?refresh=${forceRefresh ? 'true' : 'false'}&_t=${Date.now()}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            if (data && data.items) {
                setItems(data.items);
                setSummary(data.summary);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (err: any) {
            console.error('Error fetching S&P 500 technical data:', err);
            // An external market provider must never take down the whole market view.
            setItems([]);
            setSummary(null);
            setError('Los datos técnicos están temporalmente en actualización.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(false);
    }, []);

    // Unique sectors list
    const sectors = useMemo(() => {
        const set = new Set<string>();
        items.forEach((it) => {
            if (it.sector) set.add(it.sector);
        });
        return Array.from(set).sort();
    }, [items]);

    // Filter & Sort Items for MACD & RSI Cards
    const filteredItems = useMemo(() => {
        let res = [...items];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            res = res.filter(
                (it) => it.ticker.toLowerCase().includes(q) || it.name.toLowerCase().includes(q)
            );
        }

        if (selectedSignal !== 'ALL') {
            if (selectedSignal === 'BULLISH') {
                res = res.filter((it) => it.signalType === 'STRONG_BUY' || it.signalType === 'BUY');
            } else if (selectedSignal === 'BEARISH') {
                res = res.filter((it) => it.signalType === 'STRONG_SELL' || it.signalType === 'SELL');
            } else if (selectedSignal === 'NEUTRAL') {
                res = res.filter((it) => it.signalType === 'NEUTRAL');
            }
        }

        if (selectedSector !== 'ALL') {
            res = res.filter((it) => it.sector === selectedSector);
        }

        res.sort((a, b) => {
            if (sortBy === 'marketCap') return (b.marketCap || 0) - (a.marketCap || 0);
            if (sortBy === 'scoreDesc') return b.totalScore - a.totalScore;
            if (sortBy === 'scoreAsc') return a.totalScore - b.totalScore;
            if (sortBy === 'rsiDesc') return b.rsi - a.rsi;
            if (sortBy === 'rsiAsc') return a.rsi - b.rsi;
            if (sortBy === 'change1WDesc') return b.change1W - a.change1W;
            if (sortBy === 'change1WAsc') return a.change1W - b.change1W;
            return 0;
        });

        return res;
    }, [items, searchQuery, selectedSignal, selectedSector, sortBy]);

    return (
        <div className="space-y-6">
            {/* Main Header Card */}
            <div className="rounded-3xl border border-border/60 bg-white dark:bg-card p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="space-y-3 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-card border border-black/30 dark:border-white/35 text-foreground text-xs font-bold shadow-2xs">
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border border-black/30 dark:border-white/35 text-emerald-600 dark:text-emerald-400">
                                    <Flame className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                </span>
                                MAPA DE CALOR INSTITUCIONAL
                            </span>
                            <Badge variant="outline" className="text-xs font-semibold border-border/70 text-muted-foreground rounded-full px-3 py-0.5">
                                Temporalidad: 1 Semana (1W)
                            </Badge>
                            <Badge variant="outline" className="text-xs font-semibold border-border/70 text-muted-foreground rounded-full px-3 py-0.5">
                                Universo: Top 250 Acciones S&P 500
                            </Badge>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                            Mapa de Calor S&P 500
                        </h1>

                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                            Monitoreo visual del mercado en tiempo real. Analiza el mapa de calor del mercado general por sectores o explora las tarjetas técnicas de momentum para <strong className="text-foreground font-semibold">MACD Semanal</strong> y <strong className="text-foreground font-semibold">RSI Semanal</strong>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowInfoModal(!showInfoModal)}
                            className="rounded-xl border-border/70 gap-2 h-10 px-3.5 text-xs sm:text-sm font-semibold hover:border-emerald-500/50"
                        >
                            <Info className="w-4 h-4 text-emerald-600" />
                            Guía Técnica
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => fetchData(true)}
                            disabled={loading}
                            className="rounded-xl border-border/70 gap-2 h-10 px-3.5 text-xs sm:text-sm font-semibold hover:border-emerald-500/50"
                        >
                            <RefreshCw className={cn('w-4 h-4 text-emerald-600', loading && 'animate-spin')} />
                            Actualizar Datos
                        </Button>
                    </div>
                </div>

                {/* Technical Info Box */}
                {showInfoModal && (
                    <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-in fade-in-50 duration-200">
                        <div className="bg-white dark:bg-card border border-border/70 rounded-2xl p-5 space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Criterios de Compra y Acumulación
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                                <li><strong>RSI Semanal &lt; 45:</strong> Zona de sobreventa y acumulación técnica.</li>
                                <li><strong>MACD Semanal Histograma &gt; 0:</strong> Cruce alcista confirmado sobre línea de señal.</li>
                                <li><strong>Rendimiento Positivo:</strong> Impulso de volumen y capital institucional.</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-card border border-border/70 rounded-2xl p-5 space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Criterios de Venta y Sobrecompra
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                                <li><strong>RSI Semanal &gt; 55:</strong> Zona de sobrecompra con posible agotamiento.</li>
                                <li><strong>MACD Semanal Histograma &lt; 0:</strong> Cruce bajista confirmado por debajo de señal.</li>
                                <li><strong>Rendimiento Negativo:</strong> Presión distribuidora en el período.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* MODE SELECTOR (COMPACT CHECKLIST TABS) */}
                <div className="mt-6 pt-6 border-t border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Seleccionar Tipo de Visualización:
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 hidden sm:inline-block">
                            Cambia de perspectiva técnica con un clic
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Mapa de Calor Mercado General */}
                        <button
                            type="button"
                            onClick={() => setActiveMode('general')}
                            className={cn(
                                'flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border transition-all text-left cursor-pointer bg-white dark:bg-card',
                                activeMode === 'general'
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-500/40 text-muted-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    'w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0',
                                    activeMode === 'general'
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-border/80 bg-muted/40 text-transparent'
                                )}
                            >
                                ✓
                            </span>
                            <div className="min-w-0">
                                <div className={cn('font-bold text-sm leading-snug', activeMode === 'general' ? 'text-foreground' : 'text-muted-foreground')}>
                                    Mapa de Calor Mercado General
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    S&P 500 por sectores y capitalización
                                </div>
                            </div>
                        </button>

                        {/* 2. MACD Semanal */}
                        <button
                            type="button"
                            onClick={() => setActiveMode('macd')}
                            className={cn(
                                'flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border transition-all text-left cursor-pointer bg-white dark:bg-card',
                                activeMode === 'macd'
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-500/40 text-muted-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    'w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0',
                                    activeMode === 'macd'
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-border/80 bg-muted/40 text-transparent'
                                )}
                            >
                                ✓
                            </span>
                            <div className="min-w-0">
                                <div className={cn('font-bold text-sm leading-snug', activeMode === 'macd' ? 'text-foreground' : 'text-muted-foreground')}>
                                    MACD Semanal (Momento)
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    Histograma y aceleración direccional
                                </div>
                            </div>
                        </button>

                        {/* 3. RSI Semanal */}
                        <button
                            type="button"
                            onClick={() => setActiveMode('rsi')}
                            className={cn(
                                'flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border transition-all text-left cursor-pointer bg-white dark:bg-card',
                                activeMode === 'rsi'
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-500/40 text-muted-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    'w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0',
                                    activeMode === 'rsi'
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-border/80 bg-muted/40 text-transparent'
                                )}
                            >
                                ✓
                            </span>
                            <div className="min-w-0">
                                <div className={cn('font-bold text-sm leading-snug', activeMode === 'rsi' ? 'text-foreground' : 'text-muted-foreground')}>
                                    RSI Semanal (Oscilador)
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    Sobreventa (&lt;45) y Sobrecompra (&gt;55)
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Macro Summary Strip (Clean White Background) */}
                {summary && (
                    <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Sentimiento */}
                        <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-2xs">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Sentimiento General
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span
                                    className={cn(
                                        'w-2.5 h-2.5 rounded-full',
                                        summary.sentiment.includes('ALCISTA')
                                            ? 'bg-emerald-500'
                                            : summary.sentiment.includes('BAJISTA')
                                            ? 'bg-rose-500'
                                            : 'bg-zinc-400'
                                    )}
                                />
                                <span className="font-black text-lg text-foreground tracking-tight">
                                    {summary.sentiment}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {summary.totalCount} empresas analizadas
                            </span>
                        </div>

                        {/* Compras */}
                        <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-2xs">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                Compra
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                    {summary.bullishCount}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {summary.bullishPct}%
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {summary.strongBuyCount} Fuerte Compra
                            </span>
                        </div>

                        {/* Ventas */}
                        <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-2xs">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                Venta
                                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                                    {summary.bearishCount}
                                </span>
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                    {summary.bearishPct}%
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {summary.strongSellCount} Fuerte Venta
                            </span>
                        </div>

                        {/* Neutrales */}
                        <div className="flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-2xs">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                Neutrales
                                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl sm:text-3xl font-black text-foreground">
                                    {summary.neutralCount}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground">
                                    {summary.neutralPct}%
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Sin sesgo direccional claro
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT AREA: GENERAL MARKET HEATMAP */}
            {activeMode === 'general' ? (
                <div className="space-y-4">
                    <MarketGeneralHeatmap onSelectSymbol={onSelectSymbol} />
                </div>
            ) : (
                /* TECHNICAL CARDS (MACD & RSI) */
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-xs">
                        {/* Search & Signal Pills */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar ticker (ej. NVDA, AAPL)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm font-semibold rounded-xl border border-border/70 bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-foreground transition-all"
                                />
                            </div>

                            {/* Signal Filters */}
                            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl border border-border/60 bg-secondary/30">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSignal('ALL')}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                                        selectedSignal === 'ALL'
                                            ? 'bg-foreground text-background shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Todos ({items.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSignal('BULLISH')}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5',
                                        selectedSignal === 'BULLISH'
                                            ? 'bg-emerald-500 text-white shadow-xs'
                                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                    )}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Compras ({summary?.bullishCount || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSignal('BEARISH')}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5',
                                        selectedSignal === 'BEARISH'
                                            ? 'bg-rose-500 text-white shadow-xs'
                                            : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                                    )}
                                >
                                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                                    Ventas ({summary?.bearishCount || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSignal('NEUTRAL')}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5',
                                        selectedSignal === 'NEUTRAL'
                                            ? 'bg-zinc-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                                    Neutral ({summary?.neutralCount || 0})
                                </button>
                            </div>
                        </div>

                        {/* Right: Sector, Sort, Display View */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="h-10 px-3 text-xs font-semibold rounded-xl border border-border/70 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
                            >
                                <option value="ALL">Todos los Sectores ({sectors.length})</option>
                                {sectors.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="h-10 px-3 text-xs font-semibold rounded-xl border border-border/70 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
                            >
                                <option value="marketCap">Mayor Market Cap</option>
                                <option value="scoreDesc">Señal más Alcista (Score +)</option>
                                <option value="scoreAsc">Señal más Bajista (Score -)</option>
                                <option value="rsiDesc">Mayor RSI (1S)</option>
                                <option value="rsiAsc">Menor RSI (1S - Sobreventa)</option>
                                <option value="change1WDesc">Mayor Variación Semanal (+%)</option>
                                <option value="change1WAsc">Peor Variación Semanal (-%)</option>
                            </select>

                            {/* View Switcher: Cards vs Tiles */}
                            <div className="flex items-center p-1 rounded-xl border border-border/60 bg-secondary/30">
                                <button
                                    type="button"
                                    title="Vista en Tarjetas"
                                    onClick={() => setViewDisplay('cards')}
                                    className={cn(
                                        'px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all',
                                        viewDisplay === 'cards'
                                            ? 'bg-foreground text-background shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Tarjetas</span>
                                </button>
                                <button
                                    type="button"
                                    title="Vista en Mosaico Compacto"
                                    onClick={() => setViewDisplay('tiles')}
                                    className={cn(
                                        'px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all',
                                        viewDisplay === 'tiles'
                                            ? 'bg-foreground text-background shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <Grid3X3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Mosaico</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Display: Loading / Error / Cards */}
                    {loading ? (
                        <div className="h-[500px] rounded-2xl border border-border/60 bg-white dark:bg-card flex flex-col items-center justify-center gap-3">
                            <div className="h-10 w-10 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                Cargando datos del S&P 500...
                            </p>
                        </div>
                    ) : error ? (
                        <Card className="rounded-2xl border-amber-500/30 bg-white dark:bg-card p-8 text-center shadow-xs">
                            <div className="flex flex-col items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-amber-500" />
                                <h3 className="text-lg font-bold text-foreground">Datos técnicos en actualización</h3>
                                <p className="text-sm text-muted-foreground">{error}</p>
                                <Button onClick={() => fetchData(true)} className="mt-2 rounded-xl h-10 px-5 text-xs font-bold">
                                    Actualizar datos
                                </Button>
                            </div>
                        </Card>
                    ) : viewDisplay === 'tiles' ? (
                        /* MOSAIC TILES VIEW */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                            {filteredItems.map((item) => {
                                // El mosaico representa la señal del indicador que se
                                // está viendo: histograma para MACD y zonas 45/55 para RSI.
                                const isBullish = activeMode === 'macd'
                                    ? item.hist > 0
                                    : item.rsi <= 45;
                                const isBearish = activeMode === 'macd'
                                    ? item.hist < 0
                                    : item.rsi >= 55;
                                const technicalLabel = isBullish
                                    ? activeMode === 'macd' ? 'MACD ALCISTA' : 'RSI ALCISTA'
                                    : isBearish
                                        ? activeMode === 'macd' ? 'MACD BAJISTA' : 'RSI BAJISTA'
                                        : 'NEUTRAL';

                                return (
                                    <button
                                        key={item.symbol}
                                        type="button"
                                        onClick={() => onSelectSymbol?.(item.symbol)}
                                        className={cn(
                                            'group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all text-left overflow-hidden cursor-pointer hover:shadow-md',
                                            isBullish
                                                ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-400/35 via-emerald-500/18 to-emerald-500/5 dark:from-emerald-500/40 dark:via-emerald-500/20 dark:to-card shadow-emerald-500/15 hover:border-emerald-500 hover:shadow-emerald-500/25'
                                                : isBearish
                                                ? 'border-rose-500/70 bg-gradient-to-br from-rose-400/35 via-rose-500/18 to-rose-500/5 dark:from-rose-500/40 dark:via-rose-500/20 dark:to-card shadow-rose-500/15 hover:border-rose-500 hover:shadow-rose-500/25'
                                                : 'border-border/70 bg-white dark:bg-card hover:border-emerald-500/50'
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold text-sm text-foreground tracking-tight">
                                                {item.ticker}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                                                    item.change1W >= 0
                                                        ? 'text-emerald-600 bg-emerald-500/10'
                                                        : 'text-rose-600 bg-rose-500/10'
                                                )}
                                            >
                                                {item.change1W >= 0 ? '+' : ''}
                                                {item.change1W.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="my-2 space-y-0.5">
                                            <div className="text-sm font-black text-foreground">
                                                {formatMoney(item.price)}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                                <span>RSI: {item.rsi}</span>
                                                <span className={item.hist >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                    H: {item.hist >= 0 ? '+' : ''}
                                                    {item.hist.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full pt-2 border-t border-border/50 flex items-center justify-between">
                                            <span
                                                className={cn(
                                                    'text-[9.5px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5',
                                                    isBullish
                                                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/20'
                                                        : isBearish
                                                        ? 'text-rose-700 dark:text-rose-300 bg-rose-500/20'
                                                        : 'text-muted-foreground px-0 py-0'
                                                )}
                                            >
                                                {technicalLabel}
                                            </span>
                                            <ArrowUpRight className={cn(
                                                'w-3 h-3 transition-colors',
                                                isBullish ? 'text-emerald-700 dark:text-emerald-300' : isBearish ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground group-hover:text-emerald-600',
                                            )} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* DETAILED CARDS GRID */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map((item) => {
                                const isBullish = item.signalType === 'STRONG_BUY' || item.signalType === 'BUY';
                                const isBearish = item.signalType === 'STRONG_SELL' || item.signalType === 'SELL';

                                return (
                                    <div
                                        key={item.symbol}
                                        onClick={() => onSelectSymbol?.(item.symbol)}
                                        className={cn(
                                            'group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-card shadow-2xs hover:shadow-md hover:-translate-y-0.5',
                                            isBullish
                                                ? 'border-emerald-500/40 hover:border-emerald-500'
                                                : isBearish
                                                ? 'border-rose-500/40 hover:border-rose-500'
                                                : 'border-border/70 hover:border-emerald-500/50'
                                        )}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <SymbolLogo symbol={item.symbol} size={38} className="shrink-0 shadow-2xs" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-bold text-base text-foreground tracking-tight truncate">
                                                            {item.ticker}
                                                        </h3>
                                                        <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                                                            {formatMarketCap(item.marketCap)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate font-normal">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-colors shrink-0">
                                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                                            </div>
                                        </div>

                                        {/* Sector Tag */}
                                        <div className="mt-2.5">
                                            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground truncate max-w-full">
                                                {item.sector}
                                            </span>
                                        </div>

                                        {/* Price & Weekly Return */}
                                        <div className="mt-4 flex items-baseline justify-between">
                                            <span className="text-xl sm:text-2xl font-black text-foreground">
                                                {formatMoney(item.price)}
                                            </span>
                                            <div
                                                className={cn(
                                                    'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md',
                                                    item.change1W >= 0
                                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                                        : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                                                )}
                                            >
                                                {item.change1W >= 0 ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                {item.change1W >= 0 ? '+' : ''}
                                                {item.change1W.toFixed(2)}% (1S)
                                            </div>
                                        </div>

                                        {/* Technical Indicator Details */}
                                        <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                                            {activeMode === 'macd' ? (
                                                <>
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className="text-muted-foreground">Histograma MACD</span>
                                                        <span
                                                            className={cn(
                                                                'font-mono font-bold',
                                                                item.hist >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            )}
                                                        >
                                                            {item.hist >= 0 ? '+' : ''}
                                                            {item.hist.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                                        <span>MACD: {item.macd.toFixed(2)}</span>
                                                        <span>Señal: {item.signal.toFixed(2)}</span>
                                                    </div>
                                                    <div className="pt-0.5 flex items-center justify-between">
                                                        <span
                                                            className={cn(
                                                                'text-[10px] font-bold uppercase px-2 py-0.5 rounded-md',
                                                                item.hist >= 0
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : 'bg-rose-500/10 text-rose-600'
                                                            )}
                                                        >
                                                            {item.hist >= 0 ? 'Impulso Alcista' : 'Impulso Bajista'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-semibold">
                                                            Score: {item.totalScore}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className="text-muted-foreground">RSI (14 Semanal)</span>
                                                        <span
                                                            className={cn(
                                                                'font-mono font-bold',
                                                                item.rsi <= 45
                                                                    ? 'text-emerald-600'
                                                                    : item.rsi >= 55
                                                                    ? 'text-rose-600'
                                                                    : 'text-foreground'
                                                            )}
                                                        >
                                                            {item.rsi} / 100
                                                        </span>
                                                    </div>
                                                    {/* Gauge Bar */}
                                                    <div className="relative w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                                        <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-emerald-500/70 z-10" />
                                                        <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-rose-500/70 z-10" />
                                                        <div
                                                            className={cn(
                                                                'h-full rounded-full transition-all duration-300',
                                                                item.rsi <= 45
                                                                    ? 'bg-emerald-500'
                                                                    : item.rsi >= 55
                                                                    ? 'bg-rose-500'
                                                                    : 'bg-zinc-400'
                                                            )}
                                                            style={{ width: `${Math.min(Math.max(item.rsi, 0), 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="pt-0.5 flex items-center justify-between">
                                                        <span
                                                            className={cn(
                                                                'text-[10px] font-bold uppercase px-2 py-0.5 rounded-md',
                                                                item.rsi <= 45
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : item.rsi >= 55
                                                                    ? 'bg-rose-500/10 text-rose-600'
                                                                    : 'bg-muted text-muted-foreground'
                                                            )}
                                                        >
                                                            {item.rsi <= 45
                                                                ? 'Sobreventa / Acumulación'
                                                                : item.rsi >= 55
                                                                ? 'Sobrecompra / Riesgo'
                                                                : 'Zona Neutral'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-semibold">
                                                            Score: {item.totalScore}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
