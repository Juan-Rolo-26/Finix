import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { AllocationSummary, MonthlyReturnChart } from '../summary/PortfolioSummaryCharts';
import { usePortfolioHistory } from './usePortfolioHistory';
import { resolveAssetInfo } from '@/lib/tradingview';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AssetPerformanceChart } from './AssetPerformanceChart';
import { BenchmarkComparisonChart } from './BenchmarkComparisonChart';
import { PortfolioChart } from './PortfolioChart';
import { titleCase } from './chartUtils';
import { buildBenchmarkComparisonSeries } from './benchmarkUtils';
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
    name?: string;
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
    hasHoldings = true,
): Record<TimeRange, ComparisonDatum[]> {
    return TIME_RANGES.reduce((acc, range) => {
        const rangeData = seriesByRange[range] || [];
        acc[range] = buildBenchmarkComparisonSeries({
            apiSeries: rangeData,
            hasHoldings,
        });
        return acc;
    }, {} as Record<TimeRange, ComparisonDatum[]>);
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
            const ticker = asset.ticker.split(':').pop() || asset.ticker;
            const storedName = asset.name?.trim();
            const assetName = storedName && storedName.toLowerCase() !== ticker.toLowerCase()
                ? storedName
                : resolveAssetInfo(ticker).displayName;

            return {
                asset: ticker,
                symbol: asset.ticker,
                name: assetName,
                return: Number(getAssetReturn(asset).toFixed(1)),
                contribution: Number((baseCapital > 0 ? (pnl / baseCapital) * 100 : 0).toFixed(1)),
                weight: Number((totalValue > 0 ? (currentValue / totalValue) * 100 : 0).toFixed(1)),
            };
        })
        .sort((a, b) => b.weight - a.weight);
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
        // La curva histórica real llega desde /performance. Este fallback solo
        // conserva un punto actual y nunca inventa fechas ni benchmark.
        acc[range] = currentValue > 0 || capitalTotal > 0
            ? [{ date: 'Hoy', portfolio: Math.round(currentValue || capitalTotal) }]
            : [];
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
    const comparisonByRange = hasHoldings
        ? (data?.comparisonByRange ?? normalizeComparisonSeries(portfolioValueByRange, true))
        : normalizeComparisonSeries(portfolioValueByRange, false);
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

const EMPTY_ASSETS: DashboardAsset[] = [];
const EMPTY_MOVEMENTS: DashboardMovement[] = [];

export function PortfolioDashboard({
    portfolioId,
    currency = 'USD',
    metrics,
    assets = EMPTY_ASSETS,
    movements = EMPTY_MOVEMENTS,
    data,
    className,
}: PortfolioDashboardProps) {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('ALL');
    const revision = JSON.stringify([
        assets.map(asset => [asset.ticker, asset.cantidad, asset.ppc, asset.precioActual]),
        movements.map(movement => [movement.fecha, movement.total, movement.tipoMovimiento]),
    ]);
    const { history, comparison, notice: historyNotice, loading: historyLoading } = usePortfolioHistory(portfolioId, currency, selectedRange, revision);
    const hasHistory = assets.length > 0 || movements.length > 0 || history.length > 0;

    const resolvedData = useMemo(() => {
        const base = resolveData({ metrics, assets, movements, data });
        return {
            ...base,
            portfolioValueByRange: { ...base.portfolioValueByRange, [selectedRange]: history.length ? history : base.portfolioValueByRange[selectedRange] },
            comparisonByRange: { ...base.comparisonByRange, [selectedRange]: comparison },
        };
    }, [metrics, assets, movements, data, history, comparison, selectedRange]);

    const summary = useMemo(() => {
        const activePortfolioSeries = resolvedData.portfolioValueByRange[selectedRange] ?? [];
        const activeComparisonSeries = resolvedData.comparisonByRange[selectedRange] ?? [];
        const firstPoint = activePortfolioSeries[0];
        const lastPoint = activePortfolioSeries[activePortfolioSeries.length - 1];
        const lastComparison = activeComparisonSeries[activeComparisonSeries.length - 1];
        const absoluteChange = firstPoint && lastPoint ? lastPoint.portfolio - firstPoint.portfolio : 0;
        const rangeReturn = lastComparison
            ? lastComparison.portfolio - 100
            : null;
        const isPortfolioEmpty = !hasHistory;
        const benchmarkSpread = isPortfolioEmpty || typeof lastComparison?.sp500 !== 'number'
            ? null
            : lastComparison.portfolio - lastComparison.sp500;

        return {
            currentValue: metrics?.valorActual ?? lastPoint?.portfolio ?? 0,
            costBasis: metrics?.capitalInvertido ?? assets.reduce((sum, asset) => sum + asset.montoInvertido, 0),
            totalGain: metrics?.gananciaTotal ?? absoluteChange,
            totalReturn: rangeReturn,
            rangeReturn,
            benchmarkSpread,
            benchmarkAvailable: !isPortfolioEmpty && typeof lastComparison?.sp500 === 'number',
            holdings: metrics?.cantidadActivos ?? assets.length,
            sleeves: resolvedData.allocation.length,
            topWinner: [...resolvedData.assetPerformance].sort((a, b) => b.return - a.return)[0],
            isPortfolioEmpty,
        };
    }, [assets, metrics, resolvedData, selectedRange, hasHistory]);

    return (
        <div className={cn('min-w-0 space-y-6 w-full', className)}>
            {historyNotice && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{historyNotice}</span>
                </div>
            )}

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

            <div className="space-y-6">
                <MonthlyReturnChart returns={metrics?.retornosMensuales} />
                <AllocationSummary data={Object.fromEntries(resolvedData.allocation.map(item => [item.name, item.value]))} />
            </div>

            {/* ── RENDIMIENTO Y COMPARATIVA BENCHMARK (DISTRIBUCIÓN SIMÉTRICA 2 COLUMNAS) ── */}
            <div className="grid min-w-0 grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                <ErrorBoundary fallbackTitle="Rendimiento de activos temporalmente inaccesible">
                    <AssetPerformanceChart data={resolvedData.assetPerformance} />
                </ErrorBoundary>
                <ErrorBoundary fallbackTitle="Comparativa de mercado temporalmente inaccesible">
                    <BenchmarkComparisonChart
                        dataByRange={resolvedData.comparisonByRange}
                        selectedRange={selectedRange}
                        onRangeChange={setSelectedRange}
                        hasHoldings={hasHistory}
                        loading={historyLoading}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
