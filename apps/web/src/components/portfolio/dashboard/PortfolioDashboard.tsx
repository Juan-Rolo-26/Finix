import { useMemo, useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Layers3, Target, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AssetPerformanceChart } from './AssetPerformanceChart';
import { BenchmarkComparisonChart } from './BenchmarkComparisonChart';
import { PortfolioChart } from './PortfolioChart';
import { formatPercent, titleCase } from './chartUtils';
import { buildBenchmarkComparisonSeries, SP500_BENCHMARK_RETURNS } from './benchmarkUtils';
import {
    TIME_RANGES,
    type AllocationDatum,
    type AssetPerformanceDatum,
    type ComparisonDatum,
    type PortfolioDashboardData,
    type PortfolioValuePoint,
    type SectorDatum,
    type TimeRange,
} from './mockData';

interface DashboardAsset {
    ticker: string;
    tipoActivo: string;
    montoInvertido: number;
    ppc: number;
    cantidad: number;
    precioActual?: number;
    sector?: string;
}

interface DashboardMetrics {
    capitalTotal: number;
    capitalInvertido?: number;
    assetsValue?: number;
    cashBalance?: number;
    totalValue?: number;
    valorActual: number;
    gananciaTotal: number;
    variacionPorcentual: number;
    diversificacionPorClase?: Record<string, number>;
    diversificacionPorActivo?: Record<string, number>;
    cantidadActivos: number;
    retornosMensuales?: Array<{
        monthKey: string;
        label: string;
        value: number;
    }>;
}

interface DashboardMovement {
    fecha: string;
    total: number;
    tipoMovimiento: string;
}

export interface PortfolioDashboardProps {
    portfolioId?: string;
    portfolioName?: string;
    currency?: string;
    metrics?: DashboardMetrics | null;
    assets?: DashboardAsset[];
    movements?: DashboardMovement[];
    data?: Partial<PortfolioDashboardData>;
    useMockData?: boolean;
    className?: string;
}

function getAssetValue(asset: DashboardAsset) {
    return (asset.precioActual ?? asset.ppc) * asset.cantidad;
}

function getAssetReturn(asset: DashboardAsset) {
    const currentValue = getAssetValue(asset);

    if (asset.montoInvertido <= 0) {
        return 0;
    }

    return ((currentValue - asset.montoInvertido) / asset.montoInvertido) * 100;
}

function normalizeComparisonSeries(
    seriesByRange: Record<TimeRange, PortfolioValuePoint[]>,
    portfolioReturn = 0,
    hasHoldings = true,
): Record<TimeRange, ComparisonDatum[]> {
    return TIME_RANGES.reduce((acc, range) => {
        const rangeData = seriesByRange[range] || [];
        acc[range] = buildBenchmarkComparisonSeries({
            range,
            portfolioReturn,
            apiSeries: rangeData,
            hasHoldings,
        });
        return acc;
    }, {} as Record<TimeRange, ComparisonDatum[]>);
}

function createEmptySeriesByRange() {
    return TIME_RANGES.reduce((acc, range) => {
        acc[range] = [];
        return acc;
    }, {} as Record<TimeRange, PortfolioValuePoint[]>);
}

function inferSector(asset: DashboardAsset) {
    if (asset.sector) {
        return localizeSector(asset.sector);
    }

    const ticker = asset.ticker.toUpperCase();
    const type = asset.tipoActivo.toLowerCase();

    if (['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'TSLA', 'AMZN', 'PLTR'].includes(ticker)) return 'Tecnologia';
    if (['JPM', 'BAC', 'GS', 'V', 'MA', 'COIN', 'PYPL'].includes(ticker)) return 'Finanzas';
    if (['PFE', 'JNJ', 'UNH', 'ABBV', 'LLY'].includes(ticker)) return 'Salud';
    if (['XOM', 'CVX', 'BP', 'SHEL'].includes(ticker)) return 'Energia';
    if (['WMT', 'COST', 'PG', 'PEP', 'KO', 'NKE', 'MCD'].includes(ticker)) return 'Consumo';
    if (type.includes('cripto') || ['BTC', 'ETH', 'SOL', 'ADA', 'XRP'].includes(ticker)) return 'Activos digitales';
    if (type.includes('etf')) return 'ETFs';
    if (type.includes('bond') || type.includes('bono') || type.includes('fijo') || type.includes('fija')) return 'Renta fija';
    if (type.includes('cash') || type.includes('efectivo')) return 'Efectivo';

    return 'Otros';
}

function localizeSector(value: string) {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes('technolog')) return 'Tecnologia';
    if (normalized.includes('finance') || normalized.includes('financ')) return 'Finanzas';
    if (normalized.includes('health')) return 'Salud';
    if (normalized.includes('energy') || normalized.includes('energia')) return 'Energia';
    if (normalized.includes('consumer') || normalized.includes('consumo')) return 'Consumo';
    if (normalized.includes('digital')) return 'Activos digitales';
    if (normalized.includes('fixed') || normalized.includes('renta fija')) return 'Renta fija';
    if (normalized.includes('cash') || normalized.includes('efectivo')) return 'Efectivo';

    return titleCase(value);
}

function localizeAssetClass(value: string) {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes('cedear')) return 'Acciones';
    if (normalized.includes('accion') || normalized.includes('stock') || normalized.includes('equity')) return 'Acciones';
    if (normalized.includes('crypto') || normalized.includes('cripto')) return 'Cripto';
    if (normalized.includes('etf')) return 'ETFs';
    if (normalized.includes('bond') || normalized.includes('bono') || normalized.includes('fixed') || normalized.includes('fijo') || normalized.includes('fija') || normalized.includes('renta fija')) return 'Bonos';
    if (normalized.includes('cash') || normalized.includes('efectivo')) return 'Efectivo';
    if (normalized.includes('digital asset')) return 'Activos digitales';

    return titleCase(value);
}

function buildAllocationData(metrics?: DashboardMetrics | null, assets: DashboardAsset[] = []): AllocationDatum[] {
    const sourceEntries = metrics?.diversificacionPorClase
        ? Object.entries(metrics.diversificacionPorClase)
        : Object.entries(
            assets.reduce<Record<string, number>>((acc, asset) => {
                const key = localizeAssetClass(asset.tipoActivo);
                acc[key] = (acc[key] ?? 0) + getAssetValue(asset);
                return acc;
            }, {}),
        );

    const groupedEntries = sourceEntries.reduce<Record<string, number>>((acc, [name, value]) => {
        if (value <= 0) {
            return acc;
        }

        const localizedName = localizeAssetClass(name);
        acc[localizedName] = (acc[localizedName] ?? 0) + value;
        return acc;
    }, {});

    return Object.entries(groupedEntries)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

function buildAssetPerformanceData(metrics?: DashboardMetrics | null, assets: DashboardAsset[] = []): AssetPerformanceDatum[] {
    const totalValue = assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
    const baseCapital = metrics?.capitalInvertido && metrics.capitalInvertido > 0
        ? metrics.capitalInvertido
        : assets.reduce((sum, asset) => sum + asset.montoInvertido, 0);

    return assets
        .map((asset) => {
            const currentValue = getAssetValue(asset);
            const pnl = currentValue - asset.montoInvertido;

            return {
                asset: asset.ticker.split(':').pop() || asset.ticker,
                return: Number(getAssetReturn(asset).toFixed(1)),
                contribution: Number((baseCapital > 0 ? (pnl / baseCapital) * 100 : 0).toFixed(1)),
                weight: Number((totalValue > 0 ? (currentValue / totalValue) * 100 : 0).toFixed(1)),
            };
        })
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6);
}

function buildSectorData(assets: DashboardAsset[] = []): SectorDatum[] {
    return Object.entries(
        assets.reduce<Record<string, number>>((acc, asset) => {
            const sector = inferSector(asset);
            acc[sector] = (acc[sector] ?? 0) + getAssetValue(asset);
            return acc;
        }, {}),
    )
        .filter(([, value]) => value > 0)
        .map(([name, size]) => ({ name: localizeSector(name), size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 6);
}


function buildPortfolioSeries(metrics?: DashboardMetrics | null, assets: DashboardAsset[] = []) {
    const currentValue = metrics?.valorActual || assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
    const capitalTotal = metrics?.capitalTotal || metrics?.capitalInvertido || assets.reduce((sum, asset) => sum + asset.montoInvertido, 0);

    return TIME_RANGES.reduce((acc, range) => {
        const spReturnPct = SP500_BENCHMARK_RETURNS[range] ?? 0;
        const initialPoint: PortfolioValuePoint[] = (currentValue > 0 || capitalTotal > 0) ? [
            {
                date: 'Inicio',
                portfolio: Math.round(capitalTotal),
                sp500: Math.round(capitalTotal),
            },
            {
                date: 'Hoy',
                portfolio: Math.round(currentValue),
                sp500: Math.round(capitalTotal * (1 + spReturnPct / 100)),
            },
        ] : [];

        acc[range] = initialPoint;
        return acc;
    }, {} as Record<TimeRange, PortfolioValuePoint[]>);
}

function resolveData({
    metrics,
    assets,
    data,
}: {
    metrics?: DashboardMetrics | null;
    assets?: DashboardAsset[];
    movements?: DashboardMovement[];
    data?: Partial<PortfolioDashboardData>;
}): PortfolioDashboardData {
    const safeAssets = assets ?? [];
    const hasHoldings = (metrics?.cantidadActivos ?? safeAssets.length) > 0;
    const portfolioValueByRange = data?.portfolioValueByRange ?? buildPortfolioSeries(metrics, safeAssets);
    const returnPct = metrics?.variacionPorcentual ?? 0;
    const comparisonByRange = hasHoldings
        ? (data?.comparisonByRange ?? normalizeComparisonSeries(portfolioValueByRange, returnPct, true))
        : normalizeComparisonSeries(portfolioValueByRange, 0, false);
    const allocation = data?.allocation ?? buildAllocationData(metrics, safeAssets);
    const assetPerformance = data?.assetPerformance ?? buildAssetPerformanceData(metrics, safeAssets);
    const sectors = data?.sectors ?? buildSectorData(safeAssets);

    return {
        portfolioValueByRange,
        comparisonByRange,
        allocation,
        assetPerformance,
        sectors,
    };
}

export function PortfolioDashboard({
    portfolioId,
    portfolioName = 'Portafolio Finix',
    currency = 'USD',
    metrics,
    assets = [],
    movements = [],
    data,
    className,
}: PortfolioDashboardProps) {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
    const [liveHistory, setLiveHistory] = useState<Record<TimeRange, PortfolioValuePoint[]>>(() => createEmptySeriesByRange());
    const [historyNotice, setHistoryNotice] = useState<string | null>(null);

    useEffect(() => {
        const hasHoldings = (metrics?.cantidadActivos ?? assets.length) > 0;
        if (!portfolioId || !hasHoldings) {
            setLiveHistory(createEmptySeriesByRange());
            setHistoryNotice(null);
            return;
        }
        let isMounted = true;
        apiFetch(`/portfolios/${portfolioId}/history?range=${selectedRange}`)
            .then((r) => r.ok ? r.json() : null)
            .then((res) => {
                if (!isMounted || !res) return;
                if (res.insufficientData && res.message) {
                    setHistoryNotice(res.message);
                } else {
                    setHistoryNotice(null);
                }
                if (Array.isArray(res.series) && res.series.length > 0) {
                    const spReturnTotal = SP500_BENCHMARK_RETURNS[selectedRange] ?? 0;
                    const nPoints = res.series.length;
                    const baseRefValue = res.series[0]?.portfolio || res.series[0]?.invested || 10000;

                    setLiveHistory((prev) => ({
                        ...prev,
                        [selectedRange]: res.series.map((pt: any, idx: number) => {
                            const progress = nPoints > 1 ? idx / (nPoints - 1) : 1;
                            const wave = Math.sin(progress * Math.PI * 2) * (Math.abs(spReturnTotal) * 0.18);
                            const interpolatedReturn = (spReturnTotal * progress) + wave;
                            const computedSp500 = Math.round(baseRefValue * (1 + interpolatedReturn / 100));

                            return {
                                date: pt.date,
                                portfolio: Number.isFinite(pt.portfolio) ? pt.portfolio : (pt.invested || 0),
                                sp500: computedSp500,
                            };
                        }),
                    }));
                }
            })
            .catch(() => null);

        return () => {
            isMounted = false;
        };
    }, [assets.length, metrics?.cantidadActivos, portfolioId, selectedRange]);

    const resolvedData = useMemo(() => {
        const effectiveReturn = metrics?.variacionPorcentual ?? 0;
        const hasHoldings = (metrics?.cantidadActivos ?? assets.length) > 0;
        const base = resolveData({ metrics, assets, movements, data });
        const historyForRange = liveHistory[selectedRange];
        if (hasHoldings && historyForRange && historyForRange.length > 0) {
            base.portfolioValueByRange[selectedRange] = historyForRange;
        }
        base.comparisonByRange[selectedRange] = buildBenchmarkComparisonSeries({
            range: selectedRange,
            portfolioReturn: hasHoldings ? effectiveReturn : 0,
            apiSeries: hasHoldings ? historyForRange : [],
            hasHoldings,
        });
        return base;
    }, [metrics, assets, movements, data, liveHistory, selectedRange]);

    const activePortfolioSeries = resolvedData.portfolioValueByRange[selectedRange];
    const activeComparisonSeries = resolvedData.comparisonByRange[selectedRange];

    const summary = useMemo(() => {
        const firstPoint = activePortfolioSeries[0];
        const lastPoint = activePortfolioSeries[activePortfolioSeries.length - 1];
        const lastComparison = activeComparisonSeries[activeComparisonSeries.length - 1];
        const absoluteChange = firstPoint && lastPoint ? lastPoint.portfolio - firstPoint.portfolio : 0;
        const rangeReturn = firstPoint && lastPoint && firstPoint.portfolio > 0
            ? (absoluteChange / firstPoint.portfolio) * 100
            : 0;
        const isPortfolioEmpty = (metrics?.cantidadActivos ?? assets.length) === 0;
        const benchmarkSpread = isPortfolioEmpty ? 0 : (lastComparison ? lastComparison.portfolio - lastComparison.sp500 : 0);

        return {
            currentValue: metrics?.valorActual ?? lastPoint?.portfolio ?? 0,
            costBasis: metrics?.capitalInvertido ?? assets.reduce((sum, asset) => sum + asset.montoInvertido, 0),
            totalGain: metrics?.gananciaTotal ?? absoluteChange,
            totalReturn: metrics?.variacionPorcentual ?? rangeReturn,
            rangeReturn,
            benchmarkSpread,
            holdings: metrics?.cantidadActivos ?? assets.length,
            sleeves: resolvedData.allocation.length,
            topWinner: resolvedData.assetPerformance[0],
            isPortfolioEmpty,
        };
    }, [activeComparisonSeries, activePortfolioSeries, assets, metrics, resolvedData.allocation.length, resolvedData.assetPerformance]);

    const summaryCards = [
        {
            label: 'Retorno total',
            value: summary.isPortfolioEmpty ? '0.0%' : formatPercent(summary.totalReturn, 1, true),
            sublabel: summary.isPortfolioEmpty ? 'Sin movimientos aún' : `${selectedRange} variación ${formatPercent(summary.rangeReturn, 1, true)}`,
            positive: summary.totalReturn >= 0,
            icon: summary.totalReturn >= 0 ? ArrowUpRight : ArrowDownRight,
        },
        {
            label: 'Ventaja vs S&P 500',
            value: summary.isPortfolioEmpty ? '—' : formatPercent(summary.benchmarkSpread, 1, true),
            sublabel: summary.isPortfolioEmpty ? 'Sin posiciones cargadas' : (summary.benchmarkSpread >= 0 ? 'Superando al índice' : 'Por debajo del índice'),
            positive: summary.isPortfolioEmpty ? true : summary.benchmarkSpread >= 0,
            icon: Target,
        },
        {
            label: 'Activos en cartera',
            value: `${summary.holdings}`,
            sublabel: `${summary.sleeves} clases diversificadas`,
            positive: true,
            icon: Layers3,
        },
        {
            label: 'Mejor posición',
            value: summary.topWinner ? `${summary.topWinner.asset} ${formatPercent(summary.topWinner.return, 1, true)}` : 'N/A',
            sublabel: summary.topWinner ? 'Activo líder en retorno' : 'Sin posiciones',
            positive: (summary.topWinner?.return ?? 0) >= 0,
            icon: ArrowUpRight,
        },
    ];

    return (
        <div className={cn('space-y-6 w-full', className)}>
            {/* ── ENCABEZADO DE SECCIÓN ── */}
            <div className="flex flex-col items-center text-center justify-center gap-2 pt-1">
                <div className="flex items-center justify-center">
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-bold px-3 py-1">
                        Vista en vivo
                    </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2.5 text-center">
                    <WalletCards className="w-5 h-5 text-primary" />
                    <span>Métricas y Análisis de Rendimiento</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 text-center max-w-xl mx-auto">
                    Evolución patrimonial y comparativa de mercado de {portfolioName}
                </p>
            </div>

            {historyNotice && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs sm:text-sm text-blue-300 flex items-center justify-center text-center gap-2.5 backdrop-blur-sm max-w-2xl mx-auto">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <span>{historyNotice}</span>
                </div>
            )}

            {/* ── KPI METRICS STRIP (4 TARJETAS SIMÉTRICAS QUE OCUPAN TODO EL ANCHO) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
                {summaryCards.map((item) => (
                    <div
                        key={item.label}
                        className="rounded-2xl border border-border/70 bg-card/80 hover:bg-card/95 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-4 sm:p-5 backdrop-blur-md relative overflow-hidden group flex flex-col items-center text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-2 w-full text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate text-center">
                                {item.label}
                            </span>
                            <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                                item.positive 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            )}>
                                <item.icon className="h-3.5 w-3.5" />
                            </div>
                        </div>

                        <div className={cn('text-2xl sm:text-3xl font-black tracking-tight font-mono text-center', item.positive ? 'text-emerald-500' : 'text-rose-500')}>
                            {item.value}
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground/80 font-medium truncate text-center">
                            {item.sublabel}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── EVOLUCIÓN HISTÓRICA DEL PORTAFOLIO (ANCHO COMPLETO) ── */}
            <div className="w-full">
                <PortfolioChart
                    dataByRange={resolvedData.portfolioValueByRange}
                    selectedRange={selectedRange}
                    onRangeChange={setSelectedRange}
                    currency={currency}
                    costBasis={summary.costBasis}
                />
            </div>

            {/* ── RENDIMIENTO Y COMPARATIVA BENCHMARK (DISTRIBUCIÓN SIMÉTRICA 2 COLUMNAS) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <ErrorBoundary fallbackTitle="Rendimiento de activos temporalmente inaccesible">
                    <AssetPerformanceChart data={resolvedData.assetPerformance} />
                </ErrorBoundary>
                <ErrorBoundary fallbackTitle="Comparativa de mercado temporalmente inaccesible">
                    <BenchmarkComparisonChart
                        dataByRange={resolvedData.comparisonByRange}
                        selectedRange={selectedRange}
                        onRangeChange={setSelectedRange}
                        portfolioReturn={summary.totalReturn}
                        hasHoldings={!summary.isPortfolioEmpty}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
