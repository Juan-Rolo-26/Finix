import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Layers3, Target, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AssetPerformanceChart } from './AssetPerformanceChart';
import { BenchmarkComparisonChart } from './BenchmarkComparisonChart';
import { PortfolioChart } from './PortfolioChart';
import { clamp, formatCurrency, formatPercent, titleCase } from './chartUtils';
import {
    TIME_RANGES,
    mockPortfolioDashboardData,
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

interface PortfolioDashboardProps {
    portfolioName?: string;
    currency?: string;
    metrics?: DashboardMetrics | null;
    assets?: DashboardAsset[];
    movements?: DashboardMovement[];
    data?: Partial<PortfolioDashboardData>;
    useMockData?: boolean;
    className?: string;
}

const RANGE_LABELS: Record<TimeRange, string[]> = {
    '1D': ['09:30', '10:30', '11:30', '13:00', '14:30', '16:00'],
    '1W': ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'],
    '1M': ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    '3M': ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    '1Y': ['Ene', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    ALL: ['2021', '2022', '2023', '2024', '2025', '2026'],
};

const RANGE_RETURN_MULTIPLIER: Record<TimeRange, number> = {
    '1D': 0.04,
    '1W': 0.1,
    '1M': 0.22,
    '3M': 0.46,
    '1Y': 0.78,
    ALL: 1,
};

const RANGE_WOBBLE: Record<TimeRange, number> = {
    '1D': 0.004,
    '1W': 0.006,
    '1M': 0.008,
    '3M': 0.012,
    '1Y': 0.015,
    ALL: 0.02,
};

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

function normalizeComparisonSeries(seriesByRange: Record<TimeRange, PortfolioValuePoint[]>): Record<TimeRange, ComparisonDatum[]> {
    return TIME_RANGES.reduce((acc, range) => {
        const rangeData = seriesByRange[range];
        const baseValue = rangeData[0]?.portfolio || 1;

        acc[range] = rangeData.map((point) => ({
            date: point.date,
            portfolio: Number(((point.portfolio / baseValue) * 100).toFixed(1)),
            sp500: Number(((point.sp500 / baseValue) * 100).toFixed(1)),
        }));

        return acc;
    }, {} as Record<TimeRange, ComparisonDatum[]>);
}

function createEmptySeriesByRange() {
    return TIME_RANGES.reduce((acc, range) => {
        acc[range] = [];
        return acc;
    }, {} as Record<TimeRange, PortfolioValuePoint[]>);
}

function buildSeriesRange(
    currentValue: number,
    investedCapital: number,
    totalReturn: number,
    benchmarkReturn: number,
    range: TimeRange,
): PortfolioValuePoint[] {
    const labels = RANGE_LABELS[range];
    const multiplier = RANGE_RETURN_MULTIPLIER[range];
    const wobble = RANGE_WOBBLE[range];
    const scaledPortfolioReturn = totalReturn * multiplier;
    const scaledBenchmarkReturn = benchmarkReturn * multiplier;
    const portfolioStart = currentValue / (1 + scaledPortfolioReturn / 100);
    const benchmarkEnd = investedCapital * (1 + scaledBenchmarkReturn / 100);
    const benchmarkStart = investedCapital;

    return labels.map((label, index) => {
        const progress = labels.length === 1 ? 1 : index / (labels.length - 1);
        const eased = 1 - Math.pow(1 - progress, 1.45);
        const portfolioSwing = index === 0 || index === labels.length - 1 ? 0 : Math.sin((index + 1) * 1.2) * currentValue * wobble;
        const benchmarkSwing = index === 0 || index === labels.length - 1 ? 0 : Math.cos((index + 1) * 1.15) * currentValue * (wobble * 0.5);

        return {
            date: label,
            portfolio: Math.max(0, Math.round(portfolioStart + (currentValue - portfolioStart) * eased + portfolioSwing)),
            sp500: Math.max(0, Math.round(benchmarkStart + (benchmarkEnd - benchmarkStart) * eased + benchmarkSwing)),
        };
    });
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
                asset: asset.ticker,
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

function buildYearSeriesFromMonthlyReturns(
    monthlyReturns: NonNullable<DashboardMetrics['retornosMensuales']>,
    currentValue: number,
    benchmarkReturn: number,
) {
    const cleanReturns = monthlyReturns
        .filter((entry) => entry?.label && Number.isFinite(Number(entry.value)))
        .slice(-12);

    if (cleanReturns.length === 0 || currentValue <= 0) {
        return [];
    }

    const portfolioValues = new Array<number>(cleanReturns.length);
    let runningEndValue = currentValue;

    for (let index = cleanReturns.length - 1; index >= 0; index -= 1) {
        portfolioValues[index] = Math.max(0, runningEndValue);

        const returnFactor = 1 + (Number(cleanReturns[index].value) / 100);
        if (Math.abs(returnFactor) > 1e-6) {
            runningEndValue /= returnFactor;
        }
    }

    const benchmarkStart = portfolioValues[0] > 0 ? portfolioValues[0] : currentValue;
    const benchmarkEnd = benchmarkStart * (1 + benchmarkReturn / 100);

    return cleanReturns.map((entry, index) => {
        const progress = cleanReturns.length === 1 ? 1 : index / (cleanReturns.length - 1);
        const benchmarkSwing = index === 0 || index === cleanReturns.length - 1
            ? 0
            : Math.sin((index + 1) * 0.78) * benchmarkStart * 0.01;

        return {
            date: entry.label,
            portfolio: Math.round(portfolioValues[index]),
            sp500: Math.max(0, Math.round(benchmarkStart + (benchmarkEnd - benchmarkStart) * progress + benchmarkSwing)),
        };
    });
}

function buildPortfolioSeries(metrics?: DashboardMetrics | null, assets: DashboardAsset[] = [], movements: DashboardMovement[] = []) {
    if (!metrics && assets.length === 0) {
        return createEmptySeriesByRange();
    }

    const derivedCurrentValue = assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
    const derivedCapitalTotal = assets.reduce((sum, asset) => sum + asset.montoInvertido, 0);
    const currentValue = metrics?.valorActual || derivedCurrentValue;
    const capitalTotal = metrics?.capitalTotal && metrics.capitalTotal > 0
        ? metrics.capitalTotal
        : derivedCapitalTotal > 0
            ? derivedCapitalTotal
            : currentValue - (metrics?.gananciaTotal ?? 0);
    const totalReturn = capitalTotal > 0
        ? ((currentValue - capitalTotal) / capitalTotal) * 100
        : (metrics?.variacionPorcentual ?? 0);
    const buyMoves = movements.filter((movement) => movement.tipoMovimiento === 'compra').length;
    const riskBias = clamp(assets.length * 0.35 + buyMoves * 0.18, 0.8, 4.4);
    const benchmarkReturn = totalReturn >= 0
        ? clamp(totalReturn - riskBias, -18, 28)
        : clamp(totalReturn + Math.min(riskBias, 2.2), -24, 12);
    const actualYearSeries = metrics?.retornosMensuales?.length
        ? buildYearSeriesFromMonthlyReturns(metrics.retornosMensuales, currentValue, benchmarkReturn)
        : [];

    return TIME_RANGES.reduce((acc, range) => {
        if (range === '1Y' && actualYearSeries.length > 0) {
            acc[range] = actualYearSeries;
            return acc;
        }

        acc[range] = buildSeriesRange(currentValue, capitalTotal, totalReturn, benchmarkReturn, range);
        return acc;
    }, {} as Record<TimeRange, PortfolioValuePoint[]>);
}

function resolveData({
    metrics,
    assets,
    movements,
    data,
    useMockData,
}: {
    metrics?: DashboardMetrics | null;
    assets?: DashboardAsset[];
    movements?: DashboardMovement[];
    data?: Partial<PortfolioDashboardData>;
    useMockData?: boolean;
}): PortfolioDashboardData {
    const hasRealInputs = Boolean(metrics) || Boolean(assets?.length) || Boolean(movements?.length);

    if (useMockData || (!hasRealInputs && !data)) {
        return {
            ...mockPortfolioDashboardData,
            ...data,
        };
    }

    const safeAssets = assets ?? [];
    const portfolioValueByRange = data?.portfolioValueByRange ?? buildPortfolioSeries(metrics, safeAssets, movements ?? []);
    const comparisonByRange = data?.comparisonByRange ?? normalizeComparisonSeries(portfolioValueByRange);
    const allocation = data?.allocation ?? buildAllocationData(metrics, safeAssets);
    const assetPerformance = data?.assetPerformance ?? buildAssetPerformanceData(metrics, safeAssets);
    const sectors = data?.sectors ?? buildSectorData(safeAssets);

    return {
        portfolioValueByRange: portfolioValueByRange,
        comparisonByRange: comparisonByRange,
        allocation,
        assetPerformance,
        sectors,
    };
}

export function PortfolioDashboard({
    portfolioName = 'Portafolio Finix',
    currency = 'USD',
    metrics,
    assets = [],
    movements = [],
    data,
    useMockData = false,
    className,
}: PortfolioDashboardProps) {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');

    const resolvedData = useMemo(
        () => resolveData({ metrics, assets, movements, data, useMockData }),
        [metrics, assets, movements, data, useMockData],
    );

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
        const benchmarkSpread = lastComparison ? lastComparison.portfolio - lastComparison.sp500 : 0;

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
        };
    }, [activeComparisonSeries, activePortfolioSeries, assets.length, metrics, resolvedData.allocation.length, resolvedData.assetPerformance]);

    const summaryCards = [
        {
            label: 'Retorno total',
            value: formatPercent(summary.totalReturn, 1, true),
            sublabel: `${selectedRange} variacion ${formatPercent(summary.rangeReturn, 1, true)}`,
            positive: summary.totalReturn >= 0,
            icon: summary.totalReturn >= 0 ? ArrowUpRight : ArrowDownRight,
        },
        {
            label: 'Ventaja vs S&P 500',
            value: formatPercent(summary.benchmarkSpread, 1, true),
            sublabel: 'Ganancia frente al indice',
            positive: summary.benchmarkSpread >= 0,
            icon: Target,
        },
        {
            label: 'Activos',
            value: summary.holdings.toString(),
            sublabel: `${summary.sleeves} tipos cubiertos`,
            positive: true,
            icon: Layers3,
        },
    ];

    return (
        <div className={cn('space-y-6', className)}>
            <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/90 text-foreground shadow-sm">
                <CardContent className="relative overflow-hidden p-6 sm:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
                    <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_420px] xl:items-end">
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className="border-border/80 bg-background/80 text-foreground shadow-sm">
                                    Panel del portafolio
                                </Badge>
                                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                    <WalletCards className="h-3.5 w-3.5" />
                                    Vista en vivo
                                </span>
                            </div>

                            <div>
                                <p className="text-sm uppercase tracking-[0.18em] text-primary/80">Resumen</p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{portfolioName}</h2>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Valor actual del portafolio</p>
                                    <div className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                                        {formatCurrency(summary.currentValue, currency)}
                                    </div>
                                </div>
                                {summary.topWinner && (
                                    <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3 shadow-sm backdrop-blur">
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mejor activo</p>
                                        <p className="mt-1 text-lg font-semibold text-emerald-500">
                                            {summary.topWinner.asset} {formatPercent(summary.topWinner.return, 1, true)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {summaryCards.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm backdrop-blur-sm"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                                            <p className={cn('mt-2 text-2xl font-semibold', item.positive ? 'text-emerald-500' : 'text-rose-500')}>
                                                {item.value}
                                            </p>
                                        </div>
                                        <item.icon className={cn('h-5 w-5', item.positive ? 'text-emerald-500' : 'text-rose-500')} />
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">{item.sublabel}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
                <PortfolioChart
                    dataByRange={resolvedData.portfolioValueByRange}
                    selectedRange={selectedRange}
                    onRangeChange={setSelectedRange}
                    currency={currency}
                    costBasis={summary.costBasis}
                />
                <AssetPerformanceChart data={resolvedData.assetPerformance} />
                <BenchmarkComparisonChart
                    dataByRange={resolvedData.comparisonByRange}
                    selectedRange={selectedRange}
                />
            </div>
        </div>
    );
}
