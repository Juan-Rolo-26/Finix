import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect, useMemo } from 'react';
import {
    Flame,
    TrendingUp,
    RefreshCw,
    Search,
    LayoutGrid,
    Grid3X3,
    AlertCircle,
    BookOpen,
    Layers,
    Sliders,
    Zap,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketHeader, MarketQuoteCard } from './MarketPrimitives';
import MarketGeneralHeatmap from './MarketGeneralHeatmap';
import HeatmapTechnicalGuideModal from './HeatmapTechnicalGuideModal';
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
    adx: number;
    stoch: number;
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
    sentiment:
        'FUERTE ALCISTA' | 'ALCISTA' | 'NEUTRAL' | 'BAJISTA' | 'FUERTE BAJISTA';
}

interface MarketHeatmapProps {
    onSelectSymbol?: (symbol: string) => void;
}

export type HeatmapMode = 'general' | 'macd' | 'rsi' | 'adx' | 'stoch';
type FilterSignal = 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
type SortOption =
    | 'marketCap'
    | 'scoreDesc'
    | 'scoreAsc'
    | 'rsiDesc'
    | 'rsiAsc'
    | 'change1WDesc'
    | 'change1WAsc';
type ViewDisplay = 'cards' | 'tiles';

function formatMoney(n: number) {
    if (!Number.isFinite(n)) return '—';
    return `US$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMarketCap(cap: number) {
    if (!cap) return '-';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
    return `$${cap.toLocaleString()}`;
}

export default function MarketHeatmap({ onSelectSymbol }: MarketHeatmapProps) {
    const { ui: finixUi } = useFinixUiTranslation();

    const [items, setItems] = useState<HeatmapItem[]>([]);
    const [summaryState, setSummary] = useState<HeatmapSummary | null>(null);
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
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showQuickPlaybook, setShowQuickPlaybook] = useState(false);

    const fetchData = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(
                `/market/heatmap/sp500?refresh=${forceRefresh ? 'true' : 'false'}&_t=${Date.now()}`,
            );
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
            setError(
                'Los datos técnicos están temporalmente en actualización.',
            );
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
                (it) =>
                    it.ticker.toLowerCase().includes(q) ||
                    it.name.toLowerCase().includes(q),
            );
        }

        if (selectedSignal !== 'ALL') {
            if (selectedSignal === 'BULLISH') {
                res = res.filter(
                    (it) =>
                        it.signalType === 'STRONG_BUY' ||
                        it.signalType === 'BUY',
                );
            } else if (selectedSignal === 'BEARISH') {
                res = res.filter(
                    (it) =>
                        it.signalType === 'STRONG_SELL' ||
                        it.signalType === 'SELL',
                );
            } else if (selectedSignal === 'NEUTRAL') {
                res = res.filter((it) => it.signalType === 'NEUTRAL');
            }
        }

        if (selectedSector !== 'ALL') {
            res = res.filter((it) => it.sector === selectedSector);
        }

        res.sort((a, b) => {
            if (sortBy === 'marketCap')
                return (b.marketCap || 0) - (a.marketCap || 0);
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

    const modes = [
        { value: 'general', label: 'Mercado', icon: Layers },
        { value: 'macd', label: 'MACD', icon: BarChart3 },
        { value: 'rsi', label: 'RSI', icon: Sliders },
        { value: 'adx', label: 'ADX', icon: TrendingUp },
        { value: 'stoch', label: 'Estocástico', icon: Zap },
    ] as const;

    return (
        <section className="market-section">
            <HeatmapTechnicalGuideModal
                open={showGuideModal}
                onOpenChange={setShowGuideModal}
            />
            <MarketHeader
                title={finixUi("Mapa de calor")}
                eyebrow="S&P 500 · WALL STREET"
                icon={Flame}
                description={
                    <>
                        {" "}<FinixUiText text={"Top 250 empresas · Indicadores semanales"} />{" "}{summaryState?.updatedAt && (
                            <>
                                {' '}
                                {" "}<FinixUiText text={"· Actualizado"} />{""}{' '}
                                {new Date(
                                    summaryState.updatedAt,
                                ).toLocaleTimeString('es-AR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </>
                        )}
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="outline"
                            className="market-action"
                            onClick={() => setShowGuideModal(true)}
                        >
                            <BookOpen size={16} /> {" "}<FinixUiText text={"Guía técnica"} />{" "}</Button>
                        <Button
                            variant="outline"
                            className="market-action"
                            aria-expanded={showQuickPlaybook}
                            onClick={() =>
                                setShowQuickPlaybook(!showQuickPlaybook)
                            }
                        >
                            {" "}<FinixUiText text={"Criterios"} />{" "}</Button>
                        <Button
                            variant="outline"
                            className="market-icon-action"
                            title={finixUi("Actualizar mapa de calor")}
                            aria-label={finixUi("Actualizar mapa de calor")}
                            disabled={loading}
                            onClick={() => fetchData(true)}
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? 'animate-spin' : ''}
                            />
                        </Button>
                    </>
                }
            />
            {showQuickPlaybook && (
                <div className="market-note market-note--stack">
                    <p>
                        <strong>{""}<FinixUiText text={"Acumulación:"} />{""}</strong> {" "}<FinixUiText text={"RSI menor a 45, histograma MACD positivo y retorno semanal positivo."} />{" "}</p>
                    <p>
                        <strong>{""}<FinixUiText text={"Cautela:"} />{""}</strong> {" "}<FinixUiText text={"RSI mayor a 55, histograma MACD negativo y retorno semanal negativo."} />{" "}</p>
                    <p>
                        {" "}<FinixUiText text={"Los indicadores técnicos no garantizan rendimientos futuros."} />{" "}</p>
                </div>
            )}
            <div className="market-toolbar">
                <div
                    className="market-segments market-segments--centered"
                    aria-label={finixUi("Indicador del mapa de calor")}
                >
                    {modes.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={activeMode === value}
                            onClick={() => setActiveMode(value)}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {error && (
                <div role="alert" className="market-note text-destructive">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            {activeMode === 'general' ? (
                <MarketGeneralHeatmap
                    items={items}
                    summary={summaryState}
                    loading={loading}
                    onRefresh={() => fetchData(true)}
                    onSelectSymbol={onSelectSymbol}
                />
            ) : (
                <div className="market-stack market-stack--compact">
                    <div className="market-toolbar">
                        <label className="market-search">
                            <Search size={16} />
                            <input
                                aria-label={finixUi("Buscar activo técnico")}
                                placeholder={finixUi("Buscar activo o símbolo...")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>
                        <div
                            className="market-segments"
                            aria-label={finixUi("Filtrar señales")}
                        >
                            {(
                                [
                                    ['ALL', 'Todos'],
                                    ['BULLISH', 'Alcistas'],
                                    ['BEARISH', 'Bajistas'],
                                    ['NEUTRAL', 'Neutrales'],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={selectedSignal === value}
                                    onClick={() => setSelectedSignal(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <select
                            className="market-control"
                            aria-label={finixUi("Sector técnico")}
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                        >
                            <option value="ALL">{""}<FinixUiText text={"Todos los sectores"} />{""}</option>
                            {sectors.map((sector) => (
                                <option key={sector} value={sector}>
                                    {sector}
                                </option>
                            ))}
                        </select>
                        <select
                            className="market-control"
                            aria-label={finixUi("Ordenar activos técnicos")}
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as SortOption)
                            }
                        >
                            <option value="marketCap">{""}<FinixUiText text={"Capitalización"} />{""}</option>
                            <option value="scoreDesc">{""}<FinixUiText text={"Mayor score"} />{""}</option>
                            <option value="scoreAsc">{""}<FinixUiText text={"Menor score"} />{""}</option>
                            <option value="rsiDesc">{""}<FinixUiText text={"Mayor RSI"} />{""}</option>
                            <option value="rsiAsc">{""}<FinixUiText text={"Menor RSI"} />{""}</option>
                            <option value="change1WDesc">
                                {" "}<FinixUiText text={"Mayor retorno semanal"} />{" "}</option>
                            <option value="change1WAsc">
                                {" "}<FinixUiText text={"Menor retorno semanal"} />{" "}</option>
                        </select>
                        <div className="market-segments">
                            <button
                                type="button"
                                aria-label={finixUi("Vista de tarjetas")}
                                className="market-segment-icon"
                                title={finixUi("Vista de tarjetas")}
                                aria-pressed={viewDisplay === 'cards'}
                                onClick={() => setViewDisplay('cards')}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                type="button"
                                aria-label={finixUi("Vista de mosaico")}
                                className="market-segment-icon"
                                title={finixUi("Vista de mosaico")}
                                aria-pressed={viewDisplay === 'tiles'}
                                onClick={() => setViewDisplay('tiles')}
                            >
                                <Grid3X3 size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="market-results">
                        {filteredItems.length} {" "}<FinixUiText text={"de"} />{" "}{items.length} {" "}<FinixUiText text={"activos · Retorno de una semana"} />{" "}</p>
                    {loading && (
                        <div role="status" className="market-empty">
                            <RefreshCw className="animate-spin" size={20} />{' '}
                            {" "}<FinixUiText text={"Actualizando indicadores..."} />{" "}</div>
                    )}
                    {!loading && filteredItems.length === 0 && (
                        <div className="market-empty">
                            {" "}<FinixUiText text={"No hay activos para estos filtros."} />{" "}</div>
                    )}
                    {viewDisplay === 'tiles' ? (
                        <div className="market-heatmap-tiles">
                            {filteredItems.map((item) => (
                                <button
                                    type="button"
                                    key={item.symbol}
                                    className={cn(
                                        'market-heatmap-tile',
                                        technicalTone(item, activeMode),
                                    )}
                                    onClick={() =>
                                        onSelectSymbol?.(item.symbol)
                                    }
                                    title={`${item.name} (${item.ticker})`}
                                >
                                    <div className="market-heatmap-tile__header">
                                        <span className="market-heatmap-tile__symbol">
                                            {item.ticker}
                                        </span>
                                        <span className="market-heatmap-tile__change">
                                            {item.change1W > 0 ? '+' : ''}
                                            {item.change1W.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="market-heatmap-tile__price">
                                        {formatMoney(item.price)}
                                    </div>
                                    <div className="market-heatmap-tile__indicator">
                                        <span>
                                            {activeMode === 'macd'
                                                ? 'MACD'
                                                : activeMode.toUpperCase()}
                                        </span>
                                        <span>
                                            {activeMode === 'macd'
                                                ? item.hist.toFixed(2)
                                                : activeMode === 'adx'
                                                  ? item.adx
                                                  : activeMode === 'stoch'
                                                    ? item.stoch
                                                    : item.rsi}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="market-grid">
                            {filteredItems.map((item) => {
                                const indicator =
                                    activeMode === 'adx'
                                        ? item.adx
                                        : activeMode === 'stoch'
                                          ? item.stoch
                                          : item.rsi;
                                const strong =
                                    activeMode === 'adx'
                                        ? indicator >= 25
                                        : activeMode === 'stoch'
                                          ? indicator <= 20
                                          : indicator <= 45;
                                const weak =
                                    activeMode === 'adx'
                                        ? indicator < 20
                                        : activeMode === 'stoch'
                                          ? indicator >= 80
                                          : indicator >= 55;
                                const signal =
                                    activeMode === 'macd'
                                        ? item.hist > 0
                                            ? 'Impulso alcista'
                                            : item.hist < 0
                                              ? 'Impulso bajista'
                                              : 'Neutral'
                                        : activeMode === 'adx'
                                          ? strong
                                              ? 'Tendencia fuerte'
                                              : weak
                                                ? 'Tendencia débil'
                                                : 'Tendencia moderada'
                                          : strong
                                            ? 'Sobreventa'
                                            : weak
                                              ? 'Sobrecompra'
                                              : 'Zona neutral';
                                return (
                                    <MarketQuoteCard
                                        key={item.symbol}
                                        symbol={item.symbol}
                                        label={item.name}
                                        value={formatMoney(item.price)}
                                        unit="USD"
                                        change={item.change1W}
                                        quoteLabel="Precio · Variación semanal"
                                        footer={item.sector}
                                        footerRight={signal}
                                        onSelect={() =>
                                            onSelectSymbol?.(item.symbol)
                                        }
                                    >
                                        <dl className="market-metrics">
                                            {activeMode === 'macd' ? (
                                                <>
                                                    <div>
                                                        <dt>{""}<FinixUiText text={"Histograma"} />{""}</dt>
                                                        <dd
                                                            className={
                                                                item.hist >= 0
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                            }
                                                        >
                                                            {item.hist.toFixed(
                                                                2,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt>{""}<FinixUiText text={"MACD / Señal"} />{""}</dt>
                                                        <dd>
                                                            {item.macd.toFixed(
                                                                2,
                                                            )}{' '}
                                                            /{' '}
                                                            {item.signal.toFixed(
                                                                2,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <dt>
                                                            {activeMode.toUpperCase()}{' '}
                                                            {" "}<FinixUiText text={"semanal"} />{" "}</dt>
                                                        <dd>
                                                            {indicator} / 100
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt>{""}<FinixUiText text={"Capitalización"} />{""}</dt>
                                                        <dd>
                                                            {formatMarketCap(
                                                                item.marketCap,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <dt>{""}<FinixUiText text={"Score técnico"} />{""}</dt>
                                                <dd>{item.totalScore}</dd>
                                            </div>
                                            <div>
                                                <dt>{""}<FinixUiText text={"Señal"} />{""}</dt>
                                                <dd>{item.signalLabel}</dd>
                                            </div>
                                        </dl>
                                        {activeMode !== 'macd' && (
                                            <progress
                                                className="market-indicator-gauge"
                                                aria-label={activeMode.toUpperCase()}
                                                value={indicator}
                                                max={100}
                                            />
                                        )}
                                    </MarketQuoteCard>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function technicalTone(item: HeatmapItem, mode: HeatmapMode) {
    const positive =
        mode === 'macd'
            ? item.hist > 0
            : mode === 'adx'
              ? item.adx >= 25
              : mode === 'stoch'
                ? item.stoch <= 20
                : item.rsi <= 45;
    const negative =
        mode === 'macd'
            ? item.hist < 0
            : mode === 'adx'
              ? item.adx < 20
              : mode === 'stoch'
                ? item.stoch >= 80
                : item.rsi >= 55;
    return positive
        ? 'market-heatmap-tile--positive'
        : negative
          ? 'market-heatmap-tile--negative'
          : 'market-heatmap-tile--neutral';
}
