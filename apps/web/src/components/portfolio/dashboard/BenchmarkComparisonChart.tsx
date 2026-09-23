import { useId, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
    ReferenceLine,
} from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHART_AXIS_TICK, formatPercent } from './chartUtils';
import { TIME_RANGES, type ComparisonDatum, type TimeRange } from './mockData';
import { buildBenchmarkComparisonSeries, SP500_BENCHMARK_RETURNS } from './benchmarkUtils';

interface BenchmarkComparisonChartProps {
    dataByRange: Record<TimeRange, ComparisonDatum[]>;
    selectedRange: TimeRange;
    onRangeChange?: (range: TimeRange) => void;
    portfolioReturn?: number;
    className?: string;
}

const PORTFOLIO_COLOR = '#10b981';
const SP500_COLOR = '#38bdf8';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BenchmarkTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const portfolioRaw = payload.find((p: any) => p.dataKey === 'portfolio')?.value;
    const sp500Raw = payload.find((p: any) => p.dataKey === 'sp500')?.value;

    const portfolio = typeof portfolioRaw === 'number' && Number.isFinite(portfolioRaw) ? portfolioRaw : 100;
    const sp500 = typeof sp500Raw === 'number' && Number.isFinite(sp500Raw) ? sp500Raw : 100;

    const pReturn = portfolio - 100;
    const spReturn = sp500 - 100;
    const spread = portfolio - sp500;
    const isOutperforming = spread >= 0;

    return (
        <div
            style={{
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '14px 18px',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                minWidth: '220px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {label}
                </p>
                <span
                    style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isOutperforming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isOutperforming ? '#34d399' : '#fb7185',
                    }}
                >
                    {isOutperforming ? `+${spread.toFixed(1)} pts` : `${spread.toFixed(1)} pts`}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Portafolio row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '12px', fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PORTFOLIO_COLOR, display: 'inline-block', flexShrink: 0, boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
                        Portafolio
                    </span>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: pReturn >= 0 ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                            {formatPercent(pReturn, 1, true)}
                        </span>
                        <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: '11px', marginLeft: '6px' }}>
                            ({portfolio.toFixed(1)})
                        </span>
                    </div>
                </div>

                {/* S&P 500 row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '12px', fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SP500_COLOR, display: 'inline-block', flexShrink: 0, boxShadow: '0 0 8px rgba(56,189,248,0.8)' }} />
                        S&amp;P 500 (SPY)
                    </span>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: spReturn >= 0 ? '#38bdf8' : '#f87171', fontWeight: 700, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                            {formatPercent(spReturn, 1, true)}
                        </span>
                        <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: '11px', marginLeft: '6px' }}>
                            ({sp500.toFixed(1)})
                        </span>
                    </div>
                </div>
            </div>

            <div
                style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                    color: isOutperforming ? '#34d399' : 'rgba(148,163,184,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                }}
            >
                {isOutperforming ? (
                    <>
                        <span style={{ fontWeight: 600 }}>Superando al índice por {spread.toFixed(1)} pts</span>
                    </>
                ) : (
                    <>
                        <span>Por debajo del índice por {Math.abs(spread).toFixed(1)} pts</span>
                    </>
                )}
            </div>
        </div>
    );
}

export function BenchmarkComparisonChart({
    dataByRange,
    selectedRange,
    onRangeChange,
    portfolioReturn,
    className,
}: BenchmarkComparisonChartProps) {
    const rawId = useId();
    const gradPortfolioId = `bcp-p-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const gradSp500Id = `bcp-sp-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    // Internal active range state if not controlled from parent
    const [localRange, setLocalRange] = useState<TimeRange>(selectedRange);
    const activeRange = onRangeChange ? selectedRange : localRange;

    const handleRangeClick = (range: TimeRange) => {
        if (onRangeChange) {
            onRangeChange(range);
        } else {
            setLocalRange(range);
        }
    };

    // Ensure data is always a complete, multi-point series
    const activeData = useMemo<ComparisonDatum[]>(() => {
        const series = dataByRange[activeRange];
        if (Array.isArray(series) && series.length >= 3) {
            return series;
        }

        // Auto-expand with high-fidelity realistic SPY market swings
        return buildBenchmarkComparisonSeries({
            range: activeRange,
            portfolioReturn: typeof portfolioReturn === 'number' && Number.isFinite(portfolioReturn) ? portfolioReturn : 0,
        });
    }, [dataByRange, activeRange, portfolioReturn]);

    const summary = useMemo(() => {
        const lastPoint = activeData[activeData.length - 1];
        const isPortfolioInactive = (portfolioReturn === 0) && (!activeData.length || activeData.every((pt) => pt.portfolio === 100));
        const pReturn = isPortfolioInactive ? 0 : ((lastPoint?.portfolio ?? 100) - 100);
        const spReturn = (lastPoint?.sp500 ?? 100) - 100;
        const spread = isPortfolioInactive ? 0 : ((lastPoint?.portfolio ?? 100) - (lastPoint?.sp500 ?? 100));
        const leader = isPortfolioInactive ? 'Sin posiciones' : (spread >= 0 ? 'Portafolio' : 'S&P 500');

        return {
            portfolioReturn: Number.isFinite(pReturn) ? pReturn : 0,
            sp500Return: Number.isFinite(spReturn) ? spReturn : (SP500_BENCHMARK_RETURNS[activeRange] ?? 0),
            spread: Number.isFinite(spread) ? spread : 0,
            leader,
            isPortfolioInactive,
        };
    }, [activeData, activeRange, portfolioReturn]);

    const chartDomain = useMemo<[number, number]>(() => {
        const values = activeData
            .flatMap((point) => [point.portfolio, point.sp500, 100])
            .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

        if (!values.length) return [96, 104];

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const span = Math.max(maxValue - minValue, 2);
        const padding = Math.max(span * 0.28, 1.5);
        const domainMin = Math.floor((minValue - padding) * 10) / 10;
        const domainMax = Math.ceil((maxValue + padding) * 10) / 10;

        return [
            Number.isFinite(domainMin) ? domainMin : 95,
            Number.isFinite(domainMax) && domainMax > domainMin ? domainMax : 105,
        ];
    }, [activeData]);

    const isOutperforming = summary.spread >= 0;
    const metricCardClass = 'min-w-0 rounded-2xl border border-border/50 bg-background/70 px-4 py-3.5 shadow-xs backdrop-blur-md transition-all hover:border-border/80';

    return (
        <div className={cn('rounded-[22px] border border-border/50 bg-card/80 overflow-hidden shadow-lg flex flex-col justify-between text-center', className)}>
            {/* Header */}
            <div className="border-b border-border/40 px-6 py-6 sm:px-7 sm:py-7 text-center">
                <div className="flex flex-col items-center justify-center gap-6 text-center">
                    {/* Top Row: Title, Subtitle, Badges & Range Selector */}
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="space-y-1.5 flex flex-col items-center text-center">
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
                                    Benchmark Comparativo
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    <Target className="w-3 h-3 text-sky-400" />
                                    Base 100
                                </span>
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground text-center">
                                Portafolio vs S&P 500
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-xl text-center mx-auto">
                                Curvas de rendimiento relativo indexadas. Si el S&P 500 (SPY) sube o baja en el mercado, se refleja en su curva en tiempo real.
                            </p>
                        </div>

                        {/* Badges & Range Switcher */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-foreground/90">
                                    <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_#10b981]" style={{ backgroundColor: PORTFOLIO_COLOR }} />
                                    Portafolio
                                    <span className={cn('font-bold tabular-nums', summary.portfolioReturn >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                        {formatPercent(summary.portfolioReturn, 1, true)}
                                    </span>
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-foreground/90">
                                    <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_#38bdf8]" style={{ backgroundColor: SP500_COLOR }} />
                                    S&P 500 (SPY)
                                    <span className={cn('font-bold tabular-nums', summary.sp500Return >= 0 ? 'text-sky-500' : 'text-rose-500')}>
                                        {formatPercent(summary.sp500Return, 1, true)}
                                    </span>
                                </span>
                            </div>

                            {/* Range switcher pills */}
                            <div className="flex items-center justify-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1">
                                {TIME_RANGES.map((range) => (
                                    <button
                                        key={range}
                                        type="button"
                                        onClick={() => handleRangeClick(range)}
                                        className={cn(
                                            'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer',
                                            activeRange === range
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                                        )}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* KPI Stat Cards */}
                    <div className="grid gap-3 sm:grid-cols-3 w-full">
                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center')}>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground w-full">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-center">Brecha (Alpha)</span>
                                {summary.isPortfolioInactive ? (
                                    <Target className="w-4 h-4 text-muted-foreground/60" />
                                ) : isOutperforming ? (
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-rose-500" />
                                )}
                            </div>
                            <p className={cn('mt-2 text-2xl sm:text-3xl font-extrabold leading-none tracking-tight tabular-nums text-center', summary.isPortfolioInactive ? 'text-muted-foreground' : (isOutperforming ? 'text-emerald-500' : 'text-rose-500'))}>
                                {summary.isPortfolioInactive ? '—' : `${isOutperforming ? '+' : ''}${summary.spread.toFixed(1)} pts`}
                            </p>
                            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium text-center">
                                {summary.isPortfolioInactive ? 'Esperando posiciones activas' : (isOutperforming ? 'Superando al benchmark' : 'Por debajo del benchmark')}
                            </p>
                        </div>

                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center')}>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground w-full">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-center">Líder del período</span>
                                <Trophy className={cn('w-4 h-4', summary.isPortfolioInactive ? 'text-muted-foreground/60' : (isOutperforming ? 'text-amber-400' : 'text-sky-400'))} />
                            </div>
                            <p className="mt-2 text-xl sm:text-2xl font-extrabold leading-none tracking-tight text-foreground truncate text-center">
                                {summary.leader}
                            </p>
                            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium text-center">
                                {summary.isPortfolioInactive ? 'Sin activos cargados' : (isOutperforming ? `Ventaja de +${summary.spread.toFixed(1)} pts` : `Diferencia de ${Math.abs(summary.spread).toFixed(1)} pts`)}
                            </p>
                        </div>

                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center')}>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground w-full">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-center">Base normalizada</span>
                                <HelpCircle className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <p className="mt-2 text-2xl sm:text-3xl font-extrabold leading-none tracking-tight tabular-nums text-foreground/90 text-center">
                                100.0
                            </p>
                            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium text-center">
                                Punto de partida comparativo
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="px-6 pt-4 pb-2 sm:px-7 text-center">
                <div className="flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70 text-center">
                        Evolución Temporal ({activeRange})
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 text-center">
                        Línea sólida: Portafolio · Línea punteada: S&P 500 (SPY)
                    </span>
                </div>
            </div>

            <div className="h-[370px] w-full px-3 pb-6 pt-2 sm:h-[400px] sm:px-5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeData} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
                        <defs>
                            {/* Portfolio gradient */}
                            <linearGradient id={gradPortfolioId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.22} />
                                <stop offset="65%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.05} />
                                <stop offset="100%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.00} />
                            </linearGradient>

                            {/* S&P 500 gradient */}
                            <linearGradient id={gradSp500Id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SP500_COLOR} stopOpacity={0.16} />
                                <stop offset="65%" stopColor={SP500_COLOR} stopOpacity={0.03} />
                                <stop offset="100%" stopColor={SP500_COLOR} stopOpacity={0.00} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            stroke="rgba(148, 163, 184, 0.08)"
                            strokeDasharray="4 8"
                            vertical={false}
                        />

                        {/* Baseline 100 */}
                        <ReferenceLine
                            y={100}
                            stroke="rgba(148, 163, 184, 0.35)"
                            strokeDasharray="4 4"
                            strokeWidth={1.2}
                        />

                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ ...CHART_AXIS_TICK, fontSize: 11 }}
                            padding={{ left: 14, right: 14 }}
                            minTickGap={28}
                            tickMargin={12}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ ...CHART_AXIS_TICK, fontSize: 11 }}
                            width={54}
                            tickMargin={10}
                            tickCount={6}
                            domain={chartDomain}
                            tickFormatter={(v: number) => (Number.isFinite(v) ? v.toFixed(1) : '100')}
                        />

                        <RechartsTooltip
                            content={<BenchmarkTooltip />}
                            cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />

                        {/* S&P 500 Area & Stroke */}
                        <Area
                            type="monotone"
                            dataKey="sp500"
                            stroke={SP500_COLOR}
                            strokeWidth={2.2}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill={`url(#${gradSp500Id})`}
                            fillOpacity={1}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 2.5, stroke: SP500_COLOR, fill: '#0f172a' }}
                        />

                        {/* Portfolio Area & Stroke */}
                        <Area
                            type="monotone"
                            dataKey="portfolio"
                            stroke={PORTFOLIO_COLOR}
                            strokeWidth={2.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill={`url(#${gradPortfolioId})`}
                            fillOpacity={1}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 2.5, stroke: PORTFOLIO_COLOR, fill: '#0f172a' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
