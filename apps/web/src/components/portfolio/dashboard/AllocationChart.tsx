import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHART_TOOLTIP_STYLE, FINTECH_COLORS, formatPercent } from './chartUtils';
import type { AllocationDatum } from './mockData';

interface AllocationChartProps {
    data: AllocationDatum[];
    className?: string;
}

export function AllocationChart({ data, className }: AllocationChartProps) {
    const chartData = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.value, 0);

        return data.map((item) => ({
            ...item,
            percent: total > 0 ? (item.value / total) * 100 : 0,
        }));
    }, [data]);

    const totalPositions = chartData.length;
    const hasData = chartData.length > 0;

    return (
        <Card className={cn('border-border/70 bg-card/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)]', className)}>
            <CardHeader>
                <CardTitle className="text-lg">Distribucion por tipo de activo</CardTitle>
                <CardDescription>Peso del portafolio por tipo real de instrumento</CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={78}
                                        outerRadius={112}
                                        paddingAngle={chartData.length === 1 ? 0 : 5}
                                        stroke={chartData.length === 1 ? 'none' : 'hsl(var(--card))'}
                                        strokeWidth={chartData.length === 1 ? 0 : 4}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`${entry.name}-${entry.value}`}
                                                fill={FINTECH_COLORS.allocation[index % FINTECH_COLORS.allocation.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={CHART_TOOLTIP_STYLE}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                        formatter={(_value: number, _name: string, item) => [
                                            formatPercent(Number(item.payload.percent)),
                                            'Participacion',
                                        ]}
                                    />
                                    <text
                                        x="50%"
                                        y="48%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-foreground text-[28px] font-semibold"
                                    >
                                        {totalPositions}
                                    </text>
                                    <text
                                        x="50%"
                                        y="58%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-muted-foreground text-[12px]"
                                    >
                                        tipos
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            {chartData.map((entry, index) => (
                                <div
                                    key={entry.name}
                                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            className="h-3 w-3 flex-shrink-0 rounded-full"
                                            style={{ backgroundColor: FINTECH_COLORS.allocation[index % FINTECH_COLORS.allocation.length] }}
                                        />
                                        <span className="truncate text-sm font-medium text-foreground">{entry.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{formatPercent(entry.percent)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 text-center text-sm text-muted-foreground">
                        La asignacion aparecera cuando el portafolio tenga posiciones activas.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
