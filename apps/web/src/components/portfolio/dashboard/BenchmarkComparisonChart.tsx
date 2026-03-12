import { useId, useMemo } from 'react';
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
    ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { CHART_AXIS_TICK, formatPercent } from './chartUtils';
import type { ComparisonDatum, TimeRange } from './mockData';

interface BenchmarkComparisonChartProps {
    dataByRange: Record<TimeRange, ComparisonDatum[]>;
    selectedRange: TimeRange;
    className?: string;
}

const PORTFOLIO_COLOR = '#10b981';
const SP500_COLOR = '#38bdf8';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BenchmarkTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const portfolio: number = payload.find((p: any) => p.dataKey === 'portfolio')?.value ?? 100;
    const sp500: number = payload.find((p: any) => p.dataKey === 'sp500')?.value ?? 100;

    return (
        <div
            style={{
                background: 'hsl(var(--popover) / 0.97)',
                border: '1px solid hsl(var(--border) / 0.8)',
                borderRadius: '14px',
                padding: '13px 16px',
                boxShadow: '0 16px 40px hsl(var(--foreground) / 0.08), 0 2px 8px hsl(var(--foreground) / 0.04)',
                minWidth: '180px',
            }}
        >
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))', fontSize: '12px', opacity: 0.9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PORTFOLIO_COLOR, display: 'inline-block', flexShrink: 0 }} />
                        Portafolio
                    </span>
                    <span style={{ color: portfolio >= 100 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPercent(portfolio - 100, 1, true)}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))', fontSize: '12px', opacity: 0.9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SP500_COLOR, display: 'inline-block', flexShrink: 0 }} />
                        S&amp;P 500
                    </span>
                    <span style={{ color: sp500 >= 100 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPercent(sp500 - 100, 1, true)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function BenchmarkComparisonChart({
    dataByRange,
    selectedRange,
    className,
}: BenchmarkComparisonChartProps) {
    const gradientPortfolioId = `bcp-${useId().replace(/:/g, '-')}`;
    const activeData = dataByRange[selectedRange] ?? [];

    const summary = useMemo(() => {
        const lastPoint = activeData[activeData.length - 1];
        const portfolioReturn = (lastPoint?.portfolio ?? 100) - 100;
        const sp500Return = (lastPoint?.sp500 ?? 100) - 100;
        const spread = (lastPoint?.portfolio ?? 100) - (lastPoint?.sp500 ?? 100);
        const leader = spread >= 0 ? 'Portafolio' : 'S&P 500';

        return {
            portfolioReturn,
            sp500Return,
            spread,
            leader,
        };
    }, [activeData]);

    const chartDomain = useMemo<[number, number]>(() => {
        if (!activeData.length) {
            return [98, 102];
        }

        const values = activeData.flatMap((point) => [point.portfolio, point.sp500, 100]);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;
        const padding = Math.max(range * 0.55, 0.9);
        const domainMin = Math.floor((minValue - padding) * 10) / 10;
        const domainMax = Math.ceil((maxValue + padding) * 10) / 10;

        return [domainMin, domainMax];
    }, [activeData]);

    const metricCardClass = 'min-w-0 rounded-2xl border border-border/50 bg-background/70 px-4 py-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur';

    return (
        <div className={cn('rounded-[22px] border border-border/50 bg-card/80 overflow-hidden shadow-lg', className)}>
            {/* Header */}
            <div className="border-b border-border/40 px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Comparación indexada — base 100</p>
                            <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">Portafolio vs S&amp;P 500</h3>
                            <p className="text-sm text-muted-foreground/70">
                                Abrimos la escala para ver mejor la brecha real entre ambas curvas.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3.5 py-2 font-semibold text-foreground/85">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PORTFOLIO_COLOR }} />
                                Portafolio
                                <span className={cn('font-bold tabular-nums', summary.portfolioReturn >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                    {formatPercent(summary.portfolioReturn, 1, true)}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3.5 py-2 font-semibold text-foreground/85">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SP500_COLOR }} />
                                S&amp;P 500
                                <span className={cn('font-bold tabular-nums', summary.sp500Return >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                    {formatPercent(summary.sp500Return, 1, true)}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className={metricCardClass}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Brecha actual</p>
                            <p className={cn('mt-2 text-[28px] font-extrabold leading-none tracking-[-0.04em] tabular-nums', summary.spread >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                {summary.spread >= 0 ? '+' : ''}{summary.spread.toFixed(1)} pts
                            </p>
                        </div>

                        <div className={metricCardClass}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Va liderando</p>
                            <p className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.04em] text-foreground">
                                {summary.leader}
                            </p>
                        </div>

                        <div className={metricCardClass}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Base de lectura</p>
                            <p className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-foreground/85">
                                100.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            {activeData.length > 0 ? (
                <div className="px-6 pt-5 sm:px-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Escala ampliada
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground/70">
                        El eje Y se ajusta al rango real para que la diferencia se vea clara sin perder la referencia base 100.
                    </p>
                </div>
            ) : null}

            {activeData.length > 0 ? (
                <div className="h-[320px] w-full px-3 pb-5 pt-3 sm:h-[350px] sm:px-4 sm:pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeData} margin={{ top: 18, right: 18, bottom: 4, left: 0 }}>
                            <defs>
                                <linearGradient id={gradientPortfolioId} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.7} />
                                    <stop offset="100%" stopColor={PORTFOLIO_COLOR} stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                stroke="rgba(148,163,184,0.1)"
                                strokeDasharray="5 10"
                                vertical={false}
                            />
                            <ReferenceLine
                                y={100}
                                stroke="rgba(148,163,184,0.3)"
                                strokeDasharray="4 6"
                                strokeWidth={1}
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ ...CHART_AXIS_TICK, fontSize: 11 }}
                                padding={{ left: 10, right: 10 }}
                                minTickGap={24}
                                tickMargin={14}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ ...CHART_AXIS_TICK, fontSize: 11 }}
                                width={62}
                                tickMargin={12}
                                tickCount={5}
                                domain={chartDomain}
                                tickFormatter={(v: number) => v.toFixed(1)}
                            />
                            <RechartsTooltip
                                content={<BenchmarkTooltip />}
                                cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="portfolio"
                                stroke={`url(#${gradientPortfolioId})`}
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: PORTFOLIO_COLOR, fill: 'hsl(var(--background))' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sp500"
                                stroke={SP500_COLOR}
                                strokeWidth={2.25}
                                strokeDasharray="7 4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: SP500_COLOR, fill: 'hsl(var(--background))' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="mx-4 my-4 flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
                    La comparación con el S&amp;P 500 necesita al menos una serie histórica.
                </div>
            )}
        </div>
    );
}
