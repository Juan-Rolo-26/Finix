import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Layers, Grid3X3, Search } from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Button } from '@/components/ui/button';
import {
    MarketChange,
    MarketQuoteCard,
    MarketSectionTitle,
} from './MarketPrimitives';
import type {
    HeatmapItem,
    HeatmapSummary,
} from '@/components/markets/MarketHeatmap';

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
    onSelectSymbol,
}: MarketGeneralHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = usePreferencesStore();
    const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [viewSubmode, setViewSubmode] = useState<'treemap' | 'sectors'>(
        'treemap',
    );
    const [selectedSectorFilter, setSelectedSectorFilter] =
        useState<string>('ALL');
    const [searchLocal, setSearchLocal] = useState<string>('');
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
    const [widgetError, setWidgetError] = useState(false);
    const [refreshNonce, setRefreshNonce] = useState<number>(0);

    // Update timestamp when items change
    useEffect(() => {
        const now = new Date();
        setLastUpdatedTime(
            now.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        );
    }, [items]);

    // Handle Manual Refresh
    const handleTriggerRefresh = () => {
        setRefreshNonce((prev) => prev + 1);
        if (onRefresh) {
            onRefresh();
        }
    };

    // Embed TradingView treemap widget and re-inject cleanly when theme or refreshNonce changes
    useEffect(() => {
        if (!containerRef.current || viewSubmode !== 'treemap') return;
        setWidgetError(false);
        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src =
            'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.async = true;
        script.onerror = () => setWidgetError(true);
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: 'SPX500',
            grouping: 'sector',
            blockSize: 'market_cap_calc',
            blockColor: 'change',
            locale: 'es',
            symbolUrl: '',
            colorTheme: 'light',
            hasTopBar: true,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            isMonoSize: false,
            width: '100%',
            height: '100%',
        });

        // Cancel the development remount before an external script starts loading.
        const mountTimer = window.setTimeout(() => {
            containerRef.current?.appendChild(script);
        }, 0);

        return () => {
            window.clearTimeout(mountTimer);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [isDark, refreshNonce, viewSubmode]);

    // Group items by sector and compute real-time measurements
    const sectorStats = useMemo<SectorMetrics[]>(() => {
        if (!items || items.length === 0) return [];

        const map: Record<
            string,
            {
                totalCap: number;
                sum1D: number;
                sum1W: number;
                gainers: number;
                losers: number;
                list: HeatmapItem[];
            }
        > = {};

        items.forEach((stock) => {
            const sec = stock.sector || 'Otros Sectores';
            if (!map[sec]) {
                map[sec] = {
                    totalCap: 0,
                    sum1D: 0,
                    sum1W: 0,
                    gainers: 0,
                    losers: 0,
                    list: [],
                };
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

        return Object.entries(map)
            .map(([name, data]) => {
                const count = data.list.length || 1;
                // Sort stocks in this sector by market cap descending
                const sortedStocks = [...data.list].sort(
                    (a, b) => (b.marketCap || 0) - (a.marketCap || 0),
                );
                return {
                    name,
                    totalCap: data.totalCap,
                    avgChange1D: Number((data.sum1D / count).toFixed(2)),
                    avgChange1W: Number((data.sum1W / count).toFixed(2)),
                    gainersCount: data.gainers,
                    losersCount: data.losers,
                    totalCount: data.list.length,
                    topStocks: sortedStocks,
                };
            })
            .sort((a, b) => b.totalCap - a.totalCap);
    }, [items]);

    // Overall live measurements
    const overallStats = useMemo(() => {
        if (!items || items.length === 0) {
            return {
                avg1D: 0,
                gainers: 0,
                losers: 0,
                greenPct: 0,
                topGainer: null,
                topLoser: null,
            };
        }

        let sum1D = 0;
        let gainers = 0;
        let losers = 0;
        let best: HeatmapItem | null = null;
        let worst: HeatmapItem | null = null;

        items.forEach((it) => {
            const ch = it.change1D || 0;
            sum1D += ch;
            if (ch >= 0) gainers++;
            else losers++;

            if (!best || ch > (best.change1D ?? -999)) best = it;
            if (!worst || ch < (worst.change1D ?? 999)) worst = it;
        });

        const total = items.length;
        return {
            avg1D: Number((sum1D / total).toFixed(2)),
            gainers,
            losers,
            greenPct: Math.round((gainers / total) * 100),
            topGainer: best as HeatmapItem | null,
            topLoser: worst as HeatmapItem | null,
        };
    }, [items]);

    const filteredSectors = useMemo(() => {
        let list = sectorStats;
        if (selectedSectorFilter !== 'ALL') {
            list = list.filter((s) => s.name === selectedSectorFilter);
        }
        if (searchLocal.trim()) {
            const q = searchLocal.toLowerCase().trim();
            list = list.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.topStocks.some(
                        (st) =>
                            st.ticker.toLowerCase().includes(q) ||
                            st.name.toLowerCase().includes(q),
                    ),
            );
        }
        return list;
    }, [sectorStats, selectedSectorFilter, searchLocal]);

    return (
        <div className="market-stack">
            <div className="market-overview">
                <div className="market-stat">
                    <p className="market-stat__label">Variación diaria media</p>
                    <p className="market-stat__value">
                        {items.length
                            ? overallStats.avg1D.toLocaleString('es-AR') + '%'
                            : '—'}
                    </p>
                    <p className="market-stat__detail">
                        {items.length} activos
                    </p>
                </div>
                <div className="market-stat">
                    <p className="market-stat__label">Amplitud de mercado</p>
                    <p className="market-stat__value">
                        {items.length ? overallStats.greenPct + '%' : '—'}
                    </p>
                    <p className="market-stat__detail">
                        {overallStats.gainers} suben · {overallStats.losers}{' '}
                        bajan
                    </p>
                </div>
                {[
                    ['Mayor ganancia', overallStats.topGainer],
                    ['Mayor corrección', overallStats.topLoser],
                ].map(([label, stock]) => {
                    const asset = stock as HeatmapItem | null;
                    return (
                        <div className="market-stat" key={label as string}>
                            <p className="market-stat__label">
                                {label as string}
                            </p>
                            <button
                                type="button"
                                disabled={!asset}
                                className="market-stat__value market-stat-link"
                                onClick={() =>
                                    asset && onSelectSymbol?.(asset.symbol)
                                }
                            >
                                {asset?.ticker || '—'}
                            </button>
                            {asset && <MarketChange value={asset.change1D} />}
                        </div>
                    );
                })}
            </div>
            <div className="market-toolbar">
                <div className="market-segments">
                    <button
                        type="button"
                        aria-pressed={viewSubmode === 'treemap'}
                        onClick={() => setViewSubmode('treemap')}
                    >
                        <Layers size={16} /> Treemap S&amp;P 500
                    </button>
                    <button
                        type="button"
                        aria-pressed={viewSubmode === 'sectors'}
                        onClick={() => setViewSubmode('sectors')}
                    >
                        <Grid3X3 size={16} /> Sectores ({sectorStats.length})
                    </button>
                </div>
                <Button
                    variant="outline"
                    className="market-icon-action"
                    aria-label="Actualizar mediciones"
                    title="Actualizar mediciones"
                    onClick={handleTriggerRefresh}
                    disabled={loading}
                >
                    <RefreshCw
                        size={16}
                        className={loading ? 'animate-spin' : ''}
                    />
                </Button>
                {lastUpdatedTime && (
                    <span className="market-results">
                        Captura {lastUpdatedTime}
                    </span>
                )}
            </div>
            {viewSubmode === 'treemap' ? (
                <div className="market-chart market-treemap">
                    <div className="market-section-title">
                        <Layers size={16} />
                        <h2>S&amp;P 500 · Capitalización y variación diaria</h2>
                    </div>
                    <div className="market-treemap__canvas">
                        {loading && (
                            <div
                                className="market-treemap__status"
                                role="status"
                            >
                                <RefreshCw className="animate-spin" size={20} />{' '}
                                Actualizando mediciones...
                            </div>
                        )}
                        {widgetError && (
                            <div
                                className="market-treemap__status"
                                role="alert"
                            >
                                El mapa de TradingView no está disponible. Las
                                mediciones por sector siguen disponibles.
                            </div>
                        )}
                        <div
                            className="tradingview-widget-container w-full h-full"
                            ref={containerRef}
                        >
                            <div className="tradingview-widget-container__widget w-full h-full" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="market-stack">
                    <div className="market-toolbar">
                        <label className="market-search">
                            <Search size={16} />
                            <input
                                aria-label="Buscar sector o ticker"
                                placeholder="Buscar sector o ticker..."
                                value={searchLocal}
                                onChange={(e) => setSearchLocal(e.target.value)}
                            />
                        </label>
                        <select
                            className="market-control"
                            aria-label="Filtrar sector del mapa"
                            value={selectedSectorFilter}
                            onChange={(e) =>
                                setSelectedSectorFilter(e.target.value)
                            }
                        >
                            <option value="ALL">Todos los sectores</option>
                            {sectorStats.map((sector) => (
                                <option key={sector.name} value={sector.name}>
                                    {sector.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {loading && (
                        <div className="market-empty" role="status">
                            Cargando mediciones por sector...
                        </div>
                    )}
                    {!loading && filteredSectors.length === 0 && (
                        <div className="market-empty">
                            No hay sectores para estos filtros.
                        </div>
                    )}
                    {filteredSectors.map((sector) => (
                        <section key={sector.name}>
                            <div className="market-sector-heading">
                                <MarketSectionTitle
                                    title={sector.name}
                                    icon={Layers}
                                    count={sector.totalCount}
                                />
                                <MarketChange value={sector.avgChange1D} />
                                <span className="market-results">
                                    {sector.gainersCount} suben ·{' '}
                                    {sector.losersCount} bajan · Cap. US${' '}
                                    {(sector.totalCap / 1e12).toLocaleString(
                                        'es-AR',
                                        {
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                    T
                                </span>
                            </div>
                            <div className="market-grid">
                                {sector.topStocks
                                    .filter(
                                        (stock) =>
                                            !searchLocal.trim() ||
                                            sector.name
                                                .toLowerCase()
                                                .includes(
                                                    searchLocal
                                                        .toLowerCase()
                                                        .trim(),
                                                ) ||
                                            stock.ticker
                                                .toLowerCase()
                                                .includes(
                                                    searchLocal
                                                        .toLowerCase()
                                                        .trim(),
                                                ) ||
                                            stock.name
                                                .toLowerCase()
                                                .includes(
                                                    searchLocal
                                                        .toLowerCase()
                                                        .trim(),
                                                ),
                                    )
                                    .slice(0, 6)
                                    .map((stock) => (
                                        <MarketQuoteCard
                                            key={stock.symbol}
                                            symbol={stock.symbol}
                                            label={stock.name}
                                            quoteLabel="Precio · Variación diaria"
                                            value={
                                                Number.isFinite(stock.price)
                                                    ? 'US$ ' +
                                                      stock.price.toLocaleString(
                                                          'es-AR',
                                                          {
                                                              minimumFractionDigits: 2,
                                                              maximumFractionDigits: 2,
                                                          },
                                                      )
                                                    : '—'
                                            }
                                            change={stock.change1D}
                                            unit="USD"
                                            footer={sector.name}
                                            footerRight={'RSI ' + stock.rsi}
                                            onSelect={() =>
                                                onSelectSymbol?.(stock.symbol)
                                            }
                                        />
                                    ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
