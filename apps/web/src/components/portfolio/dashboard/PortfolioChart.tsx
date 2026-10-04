import { useId, useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, formatChartDate, formatCompactCurrency, formatCurrency, formatPercent } from './chartUtils';
import { TIME_RANGES, TIME_RANGE_LABELS, TIME_RANGE_SHORT_LABELS, type PortfolioValuePoint, type TimeRange } from './mockData';

interface PortfolioChartProps {
    dataByRange: Record<TimeRange, PortfolioValuePoint[]>;
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    costBasis?: number;
    currency?: string;
    className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, currency, range }: any) {
    if (!active || !payload?.length) return null;
    const val: number = payload[0]?.value ?? 0;
    const isPositive = val >= 0;

    return (
        <div
            style={CHART_TOOLTIP_STYLE}
        >
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{formatChartDate(String(label), range)}</p>
            <p style={{ color: isPositive ? '#34d399' : '#f87171', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                {formatCurrency(val, currency ?? 'USD')}
            </p>
        </div>
    );
}

export function PortfolioChart({
    dataByRange,
    selectedRange,
    onRangeChange,
    costBasis = 0,
    currency = 'USD',
    className,
}: PortfolioChartProps) {
    const gradientId = useId().replace(/:/g, '-');
    const activeData = dataByRange[selectedRange];
    const safeActiveData = useMemo(() => {
        const valid = (activeData ?? []).filter((p): p is PortfolioValuePoint => Boolean(p && typeof p.portfolio === 'number' && Number.isFinite(p.portfolio)));
        return valid;
    }, [activeData]);

    const summary = useMemo(() => {
        const first = safeActiveData[0];
        const last = safeActiveData[safeActiveData.length - 1];

        if (!first || !last) {
            return { currentValue: 0, absoluteChange: 0, percentChange: null as number | null, minValue: 0, maxValue: 100 };
        }

        const absoluteChange = last.portfolio - first.portfolio;
        const percentChange = typeof last.returnPct === 'number' && Number.isFinite(last.returnPct)
            ? last.returnPct
            : null;
        const portfolioValues = safeActiveData.map((p) => p.portfolio).filter(Number.isFinite);
        const minValue = portfolioValues.length ? Math.min(...portfolioValues) : 0;
        const maxValue = portfolioValues.length ? Math.max(...portfolioValues) : 100;

        return {
            currentValue: last.portfolio,
            absoluteChange,
            percentChange,
            minValue,
            maxValue,
        };
    }, [safeActiveData]);

    const isPositive = summary.absoluteChange >= 0;
    const positiveReturn = (summary.percentChange ?? 0) >= 0;

    const chartDomain = useMemo<[number, number]>(() => {
        if (!safeActiveData.length) return [0, 100];
        const span = Math.max(summary.maxValue - summary.minValue, 10);
        const padding = Math.max(span * 0.18, summary.currentValue * 0.04, 50);
        const minDomain = Math.max(0, Math.floor(summary.minValue - padding));
        const maxDomain = Math.ceil(summary.maxValue + padding);
        return [
            Number.isFinite(minDomain) ? minDomain : 0,
            Number.isFinite(maxDomain) && maxDomain > minDomain ? maxDomain : minDomain + 100,
        ];
    }, [safeActiveData, summary]);

    const strokeColor = isPositive ? '#10b981' : '#f87171';
    const fillColor = isPositive ? '#10b981' : '#f87171';
    const metricCardClass = 'min-w-0 rounded-2xl border border-border/50 bg-background/70 px-3 py-3.5 sm:px-4 sm:py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] backdrop-blur';

    return (
        <div className={cn('min-w-0 rounded-[22px] border border-border/50 bg-card/80 overflow-hidden shadow-sm', className)}>
            {/* Header */}
            <div className="border-b border-border/40 px-4 py-5 sm:px-6 sm:py-6">
                {/* Metrics */}
                <div className="flex flex-col gap-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {/* Valor total */}
                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center')}>
                            <p className="text-sm font-semibold text-muted-foreground text-center">Valor total</p>
                            <p className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.04em] tabular-nums sm:text-[32px] text-center">
                                {formatCurrency(summary.currentValue, currency)}
                            </p>
                        </div>
                        {/* Capital invertido */}
                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center')}>
                            <p className="text-sm font-semibold text-muted-foreground text-center">Capital invertido</p>
                            <p className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-foreground/80 sm:text-[32px] text-center">
                                {formatCurrency(costBasis, currency)}
                            </p>
                        </div>
                        {/* Cambio */}
                        <div className={cn(metricCardClass, 'flex flex-col items-center text-center justify-center gap-3')}>
                            <div className="flex flex-col items-center text-center">
                                <p className="text-sm font-semibold text-muted-foreground text-center">Cambio de valor · {TIME_RANGE_LABELS[selectedRange]}</p>
                                <p className={cn('mt-3 text-[30px] font-extrabold leading-none tracking-[-0.04em] tabular-nums sm:text-[32px] text-center', isPositive ? 'text-emerald-500' : 'text-red-500')}>
                                    {isPositive ? '+' : ''}{formatCompactCurrency(summary.absoluteChange, currency)}
                                </p>
                            </div>
                            {summary.percentChange !== null && <span
                                className={cn(
                                    'inline-flex w-fit items-center justify-center mx-auto rounded-full px-3 py-1.5 text-sm font-bold',
                                    positiveReturn
                                        ? 'bg-emerald-500/15 text-emerald-500'
                                        : 'bg-red-500/15 text-red-500',
                                )}
                            >
                                {formatPercent(summary.percentChange, 2, true)} de rendimiento
                            </span>}
                        </div>
                    </div>

                    {/* Time range buttons */}
                    <div className="flex max-w-full items-center justify-start gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-background/55 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:justify-center">
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => onRangeChange(range)}
                                title={TIME_RANGE_LABELS[range]}
                                aria-pressed={selectedRange === range}
                                className={cn(
                                    'shrink-0 rounded-xl min-h-11 px-4 py-2 text-sm font-bold transition-all duration-150',
                                    selectedRange === range
                                        ? 'bg-foreground text-background shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
                                        : 'bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                )}
                            >
                                {TIME_RANGE_SHORT_LABELS[range]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-6 pt-5 sm:px-7 flex flex-col items-center text-center">
                <h4 className="text-xl font-bold text-foreground sm:text-2xl">Evolución del portafolio</h4>
                <p className="mt-1 text-sm text-muted-foreground/70 text-center max-w-md mx-auto">
                    El valor incluye aportes y retiros. El rendimiento porcentual descuenta esos movimientos.
                </p>
            </div>

            {safeActiveData.length === 1 && <p className="px-6 pt-4 text-center text-sm text-muted-foreground">Solo hay una medición disponible; la curva aparecerá cuando exista más historial.</p>}
            {/* Chart */}
            {safeActiveData.length > 0 ? (
                <div className="h-[320px] w-full px-1 pb-4 pt-3 sm:h-[390px] sm:px-3 sm:pb-5 lg:h-[430px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart accessibilityLayer data={safeActiveData} margin={{ top: 18, right: 16, bottom: 4, left: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={fillColor} stopOpacity={0.28} />
                                    <stop offset="60%" stopColor={fillColor} stopOpacity={0.08} />
                                    <stop offset="100%" stopColor={fillColor} stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                stroke="rgba(148,163,184,0.1)"
                                strokeDasharray="5 10"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ ...CHART_AXIS_TICK, fontSize: 13 }}
                                padding={{ left: 10, right: 10 }}
                                minTickGap={30}
                                tickMargin={10}
                                tickFormatter={(value: string) => formatChartDate(value, selectedRange)}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ ...CHART_AXIS_TICK, fontSize: 13 }}
                                width={86}
                                tickMargin={8}
                                domain={chartDomain}
                                tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
                            />
                            <RechartsTooltip
                                content={<CustomTooltip currency={currency} range={selectedRange} />}
                                cursor={{ stroke: strokeColor, strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.5 }}
                            />
                            <Area
                                type="linear"
                                dataKey="portfolio"
                                stroke={strokeColor}
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill={`url(#${gradientId})`}
                                fillOpacity={1}
                                dot={safeActiveData.length === 1 ? { r: 6, fill: strokeColor } : false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: strokeColor, fill: 'hsl(var(--background))' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="mx-4 my-4 flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
                    No hay mediciones disponibles para este período.
                </div>
            )}
        </div>
    );
}
