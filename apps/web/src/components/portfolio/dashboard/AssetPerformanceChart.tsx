import { Bar, BarChart, CartesianGrid, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, FINTECH_COLORS, formatPercent } from './chartUtils';
import type { AssetPerformanceDatum } from './mockData';

interface AssetPerformanceChartProps {
    data: AssetPerformanceDatum[];
    className?: string;
}



function renderValueLabel(props: any) {
    const { value = 0, x = 0, y = 0, width = 0, height = 0 } = props;
    const numericValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(numericValue)) {
        return null;
    }

    const isPositive = numericValue >= 0;
    const labelY = isPositive ? y - 8 : y + height + 14;

    return (
        <text
            x={x + width / 2}
            y={labelY}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="rgba(15, 23, 42, 0.86)"
        >
            {formatPercent(numericValue, 1, true)}
        </text>
    );
}

export function AssetPerformanceChart({ data, className }: AssetPerformanceChartProps) {
    return (
        <Card className={cn('border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]', className)}>
            <CardHeader>
                <CardTitle className="text-lg">Rendimiento por activo</CardTitle>
                <CardDescription>Comparacion de retorno, aporte al portafolio y peso actual por posicion</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 28, right: 12, bottom: 8, left: 0 }} barGap={8} barCategoryGap="20%">
                                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                                <XAxis
                                    dataKey="asset"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={CHART_AXIS_TICK}
                                    tickMargin={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={CHART_AXIS_TICK}
                                    width={56}
                                    tickFormatter={(value: number) => formatPercent(value, 0)}
                                    orientation="left"
                                />
                                <YAxis
                                    yAxisId="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={CHART_AXIS_TICK}
                                    width={48}
                                    tickFormatter={(value: number) => formatPercent(value, 0)}
                                    orientation="right"
                                />
                                <ReferenceLine y={0} yAxisId="left" stroke="rgba(100, 116, 139, 0.38)" />
                                <Legend
                                    verticalAlign="top"
                                    align="left"
                                    iconType="circle"
                                    wrapperStyle={{
                                        paddingBottom: 20,
                                        fontSize: '12px',
                                        color: 'rgba(71,85,105,0.94)',
                                    }}
                                />
                                <RechartsTooltip
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                    formatter={(value: number, name: string) => [formatPercent(value, 2, true), name]}
                                    cursor={{ fill: 'hsl(var(--foreground) / 0.05)' }}
                                />

                                <Bar yAxisId="left" dataKey="return" name="Retorno" fill={FINTECH_COLORS.positive} radius={[4, 4, 0, 0]} maxBarSize={22}>
                                    <LabelList dataKey="return" content={(p) => renderValueLabel({ ...p, yAxisId: 'left' })} />
                                </Bar>
                                <Bar yAxisId="left" dataKey="contribution" name="Aporte" fill={FINTECH_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={22}>
                                    <LabelList dataKey="contribution" content={(p) => renderValueLabel({ ...p, yAxisId: 'left' })} />
                                </Bar>
                                <Bar yAxisId="right" dataKey="weight" name="Peso" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22}>
                                    <LabelList dataKey="weight" content={(p) => renderValueLabel({ ...p, yAxisId: 'right' })} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 text-center text-sm text-muted-foreground">
                        Este grafico se completara cuando cada activo tenga datos de retorno.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
