import React, { ReactNode, useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: 'hsl(var(--popover) / 0.97)',
    border: '1px solid hsl(var(--border) / 0.8)',
    borderRadius: '14px',
    color: 'hsl(var(--popover-foreground))',
    boxShadow: '0 16px 40px hsl(var(--foreground) / 0.08)',
    padding: '12px 16px',
    fontSize: '13px',
    fontFamily: '"Satoshi", system-ui, sans-serif',
    lineHeight: '1.5',
    minWidth: '160px',
};

const AXIS_TICK = {
    fill: 'rgba(100, 116, 139, 0.88)',
    fontSize: 12,
};

type BaseChartProps = {
    embedded?: boolean;
};

type LegendItem = {
    color: string;
    label: string;
    value: string;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatCompactCurrency(value: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    }).format(value);
}

function formatPercent(value: number) {
    return `${value.toFixed(1)}%`;
}

function truncateLabel(value: string, maxLength = 18) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}…`;
}

function ChartShell({
    title,
    description,
    embedded = false,
    children,
}: {
    title: string;
    description: string;
    embedded?: boolean;
    children: ReactNode;
}) {
    const header = (
        <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );

    if (embedded) {
        return <div className="space-y-5">{header}{children}</div>;
    }

    return (
        <Card className="h-full border-border">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function ChartLegend({ items }: { items: LegendItem[] }) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
                <div
                    key={`${item.label}-${item.color}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-sm text-foreground/90">{item.label}</span>
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/20 px-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}

export const AllocationChart = ({
    data,
    totalValue,
    embedded = false,
}: {
    data: Record<string, number>;
    totalValue: number;
} & BaseChartProps) => {
    const chartData = useMemo(() => {
        const safeTotal = totalValue > 0
            ? totalValue
            : Object.values(data).reduce((acc, value) => acc + value, 0);

        return Object.entries(data)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                percent: safeTotal > 0 ? (value / safeTotal) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value);
    }, [data, totalValue]);

    const legendItems = chartData.map((entry, index) => ({
        color: COLORS[index % COLORS.length],
        label: entry.name,
        value: `${formatCompactCurrency(entry.value)} · ${formatPercent(entry.percent)}`,
    }));

    return (
        <ChartShell
            title="Distribucion de Activos"
            description="Composicion por clase de activo"
            embedded={embedded}
        >
            {chartData.length === 0 ? (
                <EmptyChartState message="Todavia no hay datos suficientes para mostrar la composicion del portafolio." />
            ) : (
                <div className="space-y-5">
                    <div className="h-[260px] w-full sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={72}
                                    outerRadius={96}
                                    paddingAngle={chartData.length === 1 ? 0 : 5}
                                    stroke={chartData.length === 1 ? 'none' : 'hsl(var(--card))'}
                                    strokeWidth={chartData.length === 1 ? 0 : 4}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`allocation-cell-${entry.name}-${entry.value}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={legendItems} />
                </div>
            )}
        </ChartShell>
    );
};

export const TopAssetsChart = ({
    data,
    totalValue,
    embedded = false,
}: {
    data: Record<string, number>;
    totalValue: number;
} & BaseChartProps) => {
    const chartData = useMemo(() => {
        const safeTotal = totalValue > 0
            ? totalValue
            : Object.values(data).reduce((acc, value) => acc + value, 0);

        return Object.entries(data)
            .filter(([, value]) => value > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({
                name,
                value,
                percent: safeTotal > 0 ? (value / safeTotal) * 100 : 0,
            }));
    }, [data, totalValue]);

    const chartHeight = Math.max(chartData.length * 56, 260);
    const legendItems = chartData.map((entry, index) => ({
        color: COLORS[index % COLORS.length],
        label: entry.name,
        value: `${formatCompactCurrency(entry.value)} · ${formatPercent(entry.percent)}`,
    }));

    return (
        <ChartShell
            title="Top 5 Activos"
            description="Mayor peso en el portafolio"
            embedded={embedded}
        >
            {chartData.length === 0 ? (
                <EmptyChartState message="Todavia no hay activos suficientes para mostrar la distribucion individual." />
            ) : (
                <div className="space-y-5">
                    <div className="w-full" style={{ height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 8, right: 20, bottom: 8, left: 16 }}
                                barCategoryGap={18}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={AXIS_TICK}
                                    tickFormatter={(value: number) => formatCompactCurrency(value)}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={132}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tick={AXIS_TICK}
                                    tickFormatter={(value: string) => truncateLabel(value, 18)}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--foreground) / 0.05)' }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                    labelFormatter={(label: string) => label}
                                />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`asset-cell-${entry.name}-${entry.value}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={legendItems} />
                </div>
            )}
        </ChartShell>
    );
};

export const CapitalEvolutionChart = ({
    movements,
    embedded = false,
}: {
    movements: Array<{ fecha: string; total: number; tipoMovimiento: string }>;
} & BaseChartProps) => {
    const chartData = useMemo(() => {
        const sorted = [...movements].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        let cumulative = 0;
        return sorted.map((movement) => {
            if (movement.tipoMovimiento === 'compra') cumulative += movement.total;
            if (movement.tipoMovimiento === 'venta') cumulative -= movement.total;

            return {
                date: new Date(movement.fecha).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                }),
                capital: cumulative,
            };
        });
    }, [movements]);

    return (
        <ChartShell
            title="Evolucion de Capital Invertido"
            description="Crecimiento acumulado de compras y ventas"
            embedded={embedded}
        >
            {chartData.length === 0 ? (
                <EmptyChartState message="Todavia no hay movimientos suficientes para proyectar la evolucion del capital." />
            ) : (
                <div className={cn('h-[320px] w-full', embedded && 'sm:h-[360px]')}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 12, right: 18, bottom: 8, left: 6 }}>
                            <defs>
                                <linearGradient id="portfolio-capital-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                            <XAxis
                                dataKey="date"
                                minTickGap={24}
                                axisLine={false}
                                tickLine={false}
                                tick={AXIS_TICK}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={AXIS_TICK}
                                width={72}
                                tickFormatter={(value: number) => formatCompactCurrency(value)}
                            />
                            <RechartsTooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                formatter={(value: number) => [formatCurrency(value), 'Capital acumulado']}
                            />
                            <Area
                                type="monotone"
                                dataKey="capital"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#portfolio-capital-fill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartShell>
    );
};
