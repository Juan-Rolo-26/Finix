import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Flame, 
    RefreshCw, 
    TrendingUp, 
    TrendingDown, 
    Layers, 
    Grid3X3, 
    Clock, 
    ArrowUpRight, 
    ArrowDownRight,
    Search
} from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HeatmapItem, HeatmapSummary } from '@/components/markets/MarketHeatmap';

export interface MarketGeneralHeatmapProps {
    items?: HeatmapItem[];
    summary?: HeatmapSummary | null;
    loading?: boolean;
    onRefresh?: () => void;
    onSelectSymbol?: (symbol: string) => void;
}

interface SectorMetrics {
    name: string;
    totalCap: number;
    avgChange1D: number;
    avgChange1W: number;
    gainersCount: number;
    losersCount: number;
    totalCount: number;
    topStocks: HeatmapItem[];
}

export default function MarketGeneralHeatmap({
    items = [],
    summary: _summary,
    loading = false,
    onRefresh,
    onSelectSymbol
}: MarketGeneralHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = usePreferencesStore();
    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [viewSubmode, setViewSubmode] = useState<'treemap' | 'sectors'>('treemap');
    const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
    const [searchLocal, setSearchLocal] = useState<string>('');
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
    const [refreshNonce, setRefreshNonce] = useState<number>(0);

    // Update timestamp when items change
    useEffect(() => {
        const now = new Date();
        setLastUpdatedTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, [items]);

    // Handle Manual Refresh
    const handleTriggerRefresh = () => {
        setRefreshNonce(prev => prev + 1);
        if (onRefresh) {
            onRefresh();
        }
    };

    // Embed TradingView treemap widget and re-inject cleanly when theme or refreshNonce changes
    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: 'SPX500',
            grouping: 'sector',
            blockSize: 'market_cap_calc',
            blockColor: 'change',
            locale: 'es',
            symbolUrl: '',
            colorTheme: isDark ? 'dark' : 'light',
            hasTopBar: true,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            isMonoSize: false,
            width: '100%',
            height: '100%'
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [isDark, refreshNonce]);

    // Group items by sector and compute real-time measurements
    const sectorStats = useMemo<SectorMetrics[]>(() => {
        if (!items || items.length === 0) return [];

        const map: Record<string, { totalCap: number; sum1D: number; sum1W: number; gainers: number; losers: number; list: HeatmapItem[] }> = {};

        items.forEach(stock => {
            const sec = stock.sector || 'Otros Sectores';
            if (!map[sec]) {
                map[sec] = { totalCap: 0, sum1D: 0, sum1W: 0, gainers: 0, losers: 0, list: [] };
            }
            map[sec].totalCap += stock.marketCap || 0;
            map[sec].sum1D += stock.change1D || 0;
            map[sec].sum1W += stock.change1W || 0;
            if ((stock.change1D || 0) >= 0) {
                map[sec].gainers += 1;
            } else {
                map[sec].losers += 1;
            }
            map[sec].list.push(stock);
        });

        return Object.entries(map).map(([name, data]) => {
            const count = data.list.length || 1;
            // Sort stocks in this sector by market cap descending
            const sortedStocks = [...data.list].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
            return {
                name,
                totalCap: data.totalCap,
                avgChange1D: Number((data.sum1D / count).toFixed(2)),
                avgChange1W: Number((data.sum1W / count).toFixed(2)),
                gainersCount: data.gainers,
                losersCount: data.losers,
                totalCount: data.list.length,
                topStocks: sortedStocks
            };
        }).sort((a, b) => b.totalCap - a.totalCap);
    }, [items]);

    // Overall live measurements
    const overallStats = useMemo(() => {
        if (!items || items.length === 0) {
            return {
                avg1D: 0,
                gainers: 0,
                losers: 0,
                greenPct: 50,
                topGainer: null,
                topLoser: null
            };
        }

        let sum1D = 0;
        let gainers = 0;
        let losers = 0;
        let best: HeatmapItem | null = null;
        let worst: HeatmapItem | null = null;

        items.forEach(it => {
            const ch = it.change1D || 0;
            sum1D += ch;
            if (ch >= 0) gainers++;
            else losers++;

            if (!best || ch > (best.change1D || -999)) best = it;
            if (!worst || ch < (worst.change1D || 999)) worst = it;
        });

        const total = items.length;
        return {
            avg1D: Number((sum1D / total).toFixed(2)),
            gainers,
            losers,
            greenPct: Math.round((gainers / total) * 100),
            topGainer: best as HeatmapItem | null,
            topLoser: worst as HeatmapItem | null
        };
    }, [items]);

    const filteredSectors = useMemo(() => {
        let list = sectorStats;
        if (selectedSectorFilter !== 'ALL') {
            list = list.filter(s => s.name === selectedSectorFilter);
        }
        if (searchLocal.trim()) {
            const q = searchLocal.toLowerCase().trim();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.topStocks.some(st => st.ticker.toLowerCase().includes(q) || st.name.toLowerCase().includes(q))
            );
        }
        return list;
    }, [sectorStats, selectedSectorFilter, searchLocal]);

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* ── BANNER DE MEDICIONES EN TIEMPO REAL ── */}
            <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md p-4 sm:p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                            <Flame className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                                    Mediciones en Vivo del Mapa de Calor
                                </h3>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Tiempo Real
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Agrupación sectorial institucional sobre 250 activos de Wall Street con ponderación por capitalización.
                            </p>
                        </div>
                    </div>

                    {/* Controles de vista y botón de recarga */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center p-1 rounded-xl bg-secondary/40 border border-border/60">
                            <button
                                type="button"
                                onClick={() => setViewSubmode('treemap')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                    viewSubmode === 'treemap'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                Treemap S&amp;P 500
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewSubmode('sectors')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                    viewSubmode === 'sectors'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Grid3X3 className="w-3.5 h-3.5" />
                                Medición Sectorial ({sectorStats.length})
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleTriggerRefresh}
                            disabled={loading}
                            className="rounded-xl border-border/70 hover:border-emerald-500/50 gap-2 h-9 px-3 text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                            <RefreshCw className={cn('w-3.5 h-3.5 text-emerald-500', loading && 'animate-spin')} />
                            <span>Actualizar</span>
                        </Button>

                        {lastUpdatedTime && (
                            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground/70" />
                                {lastUpdatedTime}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── METRIC CARDS EN TIEMPO REAL ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
                    {/* Variación Promedio Sesión */}
                    <div className="p-3.5 rounded-2xl bg-secondary/25 border border-border/60 flex flex-col justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Variación Diaria S&amp;P 500
                        </span>
                        <div className="flex items-baseline gap-2 my-1">
                            <span className={cn(
                                'text-2xl font-black tracking-tight',
                                overallStats.avg1D >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            )}>
                                {overallStats.avg1D >= 0 ? `+${overallStats.avg1D}%` : `${overallStats.avg1D}%`}
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                media rueda
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className={cn('h-full', overallStats.avg1D >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                                style={{ width: `${Math.min(Math.abs(overallStats.avg1D) * 20, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Amplitud de Mercado (Verde vs Rojo) */}
                    <div className="p-3.5 rounded-2xl bg-secondary/25 border border-border/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Amplitud de Mercado
                            </span>
                            <span className="text-xs font-bold text-emerald-500">
                                {overallStats.greenPct}% Alcistas
                            </span>
                        </div>
                        <div className="flex items-center justify-between my-1 text-sm font-black">
                            <span className="text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> {overallStats.gainers} suben
                            </span>
                            <span className="text-rose-500 flex items-center gap-1">
                                <TrendingDown className="w-4 h-4" /> {overallStats.losers} bajan
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-rose-500 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${overallStats.greenPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Activo Líder de la Jornada */}
                    <div 
                        onClick={() => overallStats.topGainer && onSelectSymbol?.(overallStats.topGainer.ticker)}
                        className="p-3.5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 flex flex-col justify-between cursor-pointer hover:bg-emerald-500/[0.08] transition-colors"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                            Mayor Ganancia
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                        <div className="flex items-baseline justify-between my-1">
                            <span className="text-xl font-black text-foreground">
                                {overallStats.topGainer?.ticker || '---'}
                            </span>
                            <span className="text-lg font-black text-emerald-500">
                                {overallStats.topGainer?.change1D !== undefined ? `+${overallStats.topGainer.change1D.toFixed(2)}%` : '+0.0%'}
                            </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                            {overallStats.topGainer?.name || 'Cargando cotización...'}
                        </span>
                    </div>

                    {/* Activo con Mayor Corrección */}
                    <div 
                        onClick={() => overallStats.topLoser && onSelectSymbol?.(overallStats.topLoser.ticker)}
                        className="p-3.5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 flex flex-col justify-between cursor-pointer hover:bg-rose-500/[0.08] transition-colors"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
                            Mayor Corrección
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        </span>
                        <div className="flex items-baseline justify-between my-1">
                            <span className="text-xl font-black text-foreground">
                                {overallStats.topLoser?.ticker || '---'}
                            </span>
                            <span className="text-lg font-black text-rose-500">
                                {overallStats.topLoser?.change1D !== undefined ? `${overallStats.topLoser.change1D.toFixed(2)}%` : '-0.0%'}
                            </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                            {overallStats.topLoser?.name || 'Cargando cotización...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── CUERPO PRINCIPAL SEGÚN SUBMODO ── */}
            {viewSubmode === 'treemap' ? (
                <div className="w-full rounded-3xl overflow-hidden border border-border/80 bg-white dark:bg-card shadow-sm">
                    {/* Top Bar inside Treemap */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border/60 bg-secondary/20 dark:bg-secondary/10">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Layers className="w-4 h-4 text-emerald-500" />
                            <span>Treemap Oficial S&amp;P 500 Interactivo</span>
                            <span className="text-muted-foreground font-normal hidden sm:inline">| Agrupación por Capitalización y Variación %</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Haz clic en un sector para hacer zoom o en cualquier acción para ver sus métricas</span>
                        </div>
                    </div>

                    <div className="w-full h-[720px] md:h-[800px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card border border-border shadow-md text-xs font-bold">
                                    <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                    <span>Actualizando mediciones en tiempo real...</span>
                                </div>
                            </div>
                        )}
                        <div className="tradingview-widget-container w-full h-full" ref={containerRef}>
                            <div className="tradingview-widget-container__widget w-full h-full" />
                        </div>
                    </div>
                </div>
            ) : (
                /* ── SUBMODO: MEDICIÓN SECTORIAL NATIVA FINIX ── */
                <div className="space-y-4">
                    {/* Filtros de sectores y búsqueda rápida */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filtrar sectores o tickers..."
                                value={searchLocal}
                                onChange={(e) => setSearchLocal(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border/70 bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            <button
                                type="button"
                                onClick={() => setSelectedSectorFilter('ALL')}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                    selectedSectorFilter === 'ALL'
                                        ? 'bg-foreground text-background'
                                        : 'text-muted-foreground hover:bg-secondary/50'
                                )}
                            >
                                Todos ({sectorStats.length})
                            </button>
                            {sectorStats.slice(0, 5).map(s => (
                                <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => setSelectedSectorFilter(s.name)}
                                    className={cn(
                                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                                        selectedSectorFilter === s.name
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-muted-foreground hover:bg-secondary/50'
                                    )}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid de Sectores con Mediciones en Vivo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredSectors.map((sector) => {
                            const isPositive = sector.avgChange1D >= 0;
                            const greenPct = Math.round((sector.gainersCount / sector.totalCount) * 100);

                            return (
                                <div
                                    key={sector.name}
                                    className="p-5 rounded-3xl bg-card border border-border/80 hover:border-emerald-500/40 transition-all shadow-2xs space-y-4 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Cabecera del Sector */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                                    {sector.name}
                                                </h4>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {sector.totalCount} empresas · Cap: ${(sector.totalCap / 1e12).toFixed(2)}T
                                                </span>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black',
                                                    isPositive 
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                                                )}>
                                                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {isPositive ? `+${sector.avgChange1D}%` : `${sector.avgChange1D}%`}
                                                </span>
                                                <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                    Semanal: {sector.avgChange1W >= 0 ? `+${sector.avgChange1W}%` : `${sector.avgChange1W}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Barra de proporción verde/rojo */}
                                        <div className="mt-3 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                                <span className="text-emerald-500">{sector.gainersCount} alcistas ({greenPct}%)</span>
                                                <span className="text-rose-500">{sector.losersCount} bajistas</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-rose-500/80 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${greenPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mosaico de activos líderes con color dinámico */}
                                    <div className="space-y-2 pt-2 border-t border-border/50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Empresas Principales (Clic para analizar):
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {sector.topStocks.slice(0, 6).map((stock) => {
                                                const stockPos = (stock.change1D || 0) >= 0;
                                                return (
                                                    <button
                                                        key={stock.ticker}
                                                        type="button"
                                                        onClick={() => onSelectSymbol?.(stock.ticker)}
                                                        className={cn(
                                                            'p-2 rounded-xl border text-left transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-1',
                                                            stockPos
                                                                ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/50'
                                                                : 'bg-rose-500/[0.08] dark:bg-rose-500/10 border-rose-500/25 hover:border-rose-500/50'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-black text-xs text-foreground">
                                                                {stock.ticker}
                                                            </span>
                                                            <span className={cn(
                                                                'text-[11px] font-black',
                                                                stockPos ? 'text-emerald-500' : 'text-rose-500'
                                                            )}>
                                                                {stockPos ? `+${stock.change1D?.toFixed(1)}%` : `${stock.change1D?.toFixed(1)}%`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                            <span>${stock.price?.toFixed(1)}</span>
                                                            <span className="font-mono text-[9px] uppercase px-1 rounded bg-secondary/80">
                                                                RSI {Math.round(stock.rsi || 50)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
