import { useMemo } from 'react';
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
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

const TOOLTIP_STYLE = {
    backgroundColor: '#111827',
    borderColor: 'rgba(75, 85, 99, 0.9)',
    borderRadius: '12px',
    color: '#f3f4f6',
};

const AXIS_TICK = {
    fill: 'rgba(229, 231, 235, 0.72)',
    fontSize: 12,
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

export const PortfolioAdvancedMetrics = ({
    assets,
}: {
    metrics: any;
    assets: any[];
}) => {
    const assetsByClass = useMemo(() => {
        const result: Record<string, { value: number; count: number; items: any[] }> = {};

        assets.forEach((asset) => {
            const currentPrice = asset.precioActual ?? asset.ppc;
            const value = currentPrice * asset.cantidad;

            if (!result[asset.tipoActivo]) {
                result[asset.tipoActivo] = { value: 0, count: 0, items: [] };
            }

            result[asset.tipoActivo].value += value;
            result[asset.tipoActivo].count += 1;
            result[asset.tipoActivo].items.push({
                ticker: asset.ticker,
                value,
                profit: value - asset.montoInvertido,
                profitPct: asset.montoInvertido > 0 ? ((value - asset.montoInvertido) / asset.montoInvertido) * 100 : 0,
            });
        });

        return Object.entries(result)
            .map(([name, data]) => ({
                name,
                ...data,
            }))
            .sort((a, b) => b.value - a.value);
    }, [assets]);

    const concentrationData = useMemo(() => {
        const sorted = [...assets]
            .map((asset) => {
                const currentPrice = asset.precioActual ?? asset.ppc;
                return {
                    name: asset.ticker,
                    value: currentPrice * asset.cantidad,
                };
            })
            .filter((asset) => asset.value > 0)
            .sort((a, b) => b.value - a.value);

        const top3 = sorted.slice(0, 3);
        const restValue = sorted.slice(3).reduce((acc, current) => acc + current.value, 0);

        if (restValue > 0) {
            return [...top3, { name: 'Resto', value: restValue }];
        }

        return top3;
    }, [assets]);

    const concentrationTotal = concentrationData.reduce((acc, current) => acc + current.value, 0);

    const scatterData = useMemo(() => {
        return assets.map((asset) => {
            const currentPrice = asset.precioActual ?? asset.ppc;
            const value = currentPrice * asset.cantidad;
            const profitPct = asset.montoInvertido > 0 ? ((value - asset.montoInvertido) / asset.montoInvertido) * 100 : 0;

            let simulatedRisk = 50;
            if (asset.tipoActivo.toLowerCase().includes('cripto')) simulatedRisk = 90;
            if (asset.tipoActivo.toLowerCase().includes('accion')) simulatedRisk = 70;
            if (asset.tipoActivo.toLowerCase().includes('bono') || asset.tipoActivo.toLowerCase().includes('fijo')) simulatedRisk = 20;

            return {
                ticker: asset.ticker,
                return: profitPct,
                risk: simulatedRisk,
                value,
            };
        });
    }, [assets]);

    const detailedChartHeight = Math.max(assetsByClass.length * 48, 250);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="col-span-1 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Concentracion</CardTitle>
                        <CardDescription>Top 3 activos vs resto</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                    <Pie
                                        data={concentrationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={56}
                                        outerRadius={82}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="rgba(17, 24, 39, 0.95)"
                                        strokeWidth={2}
                                    >
                                        {concentrationData.map((entry, index) => (
                                            <Cell
                                                key={`concentration-cell-${entry.name}-${entry.value}`}
                                                fill={index < 3 ? COLORS[index % COLORS.length] : '#4b5563'}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                        contentStyle={TOOLTIP_STYLE}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2">
                            {concentrationData.map((entry, index) => {
                                const percent = concentrationTotal > 0 ? (entry.value / concentrationTotal) * 100 : 0;
                                return (
                                    <div
                                        key={entry.name}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                style={{ backgroundColor: index < 3 ? COLORS[index % COLORS.length] : '#4b5563' }}
                                            />
                                            <span className="truncate text-sm text-foreground/90">{entry.name}</span>
                                        </div>
                                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                                            {formatCompactCurrency(entry.value)} · {formatPercent(percent)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-border md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Composicion Detallada por Clase</CardTitle>
                        <CardDescription>Valor aportado por categoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full" style={{ height: detailedChartHeight }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={assetsByClass}
                                    layout="vertical"
                                    margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
                                    barCategoryGap={16}
                                >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={AXIS_TICK}
                                        tickFormatter={(value: number) => formatCompactCurrency(value)}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={120}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        tick={AXIS_TICK}
                                        tickFormatter={(value: string) => truncateLabel(value, 18)}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                                        contentStyle={TOOLTIP_STYLE}
                                    />
                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28}>
                                        {assetsByClass.map((entry, index) => (
                                            <Cell
                                                key={`class-cell-${entry.name}-${entry.value}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Rentabilidad vs Volatilidad Estimada</CardTitle>
                    <CardDescription>Analisis de riesgo y retorno por cada activo del portafolio</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 24, bottom: 20, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    type="number"
                                    dataKey="risk"
                                    name="Riesgo estimado"
                                    unit=" pts"
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={AXIS_TICK}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="return"
                                    name="Rentabilidad"
                                    unit="%"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={AXIS_TICK}
                                />
                                <ZAxis type="number" dataKey="value" range={[80, 360]} name="Valor" />
                                <RechartsTooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.ticker ?? 'Activo'}
                                    formatter={(value, name) => {
                                        if (name === 'Rentabilidad') return [`${Number(value).toFixed(2)}%`, name];
                                        if (name === 'Valor') return [formatCurrency(Number(value)), name];
                                        return [value, name];
                                    }}
                                />
                                <Scatter name="Activos" data={scatterData} fill="#3b82f6" fillOpacity={0.75}>
                                    {scatterData.map((entry) => (
                                        <Cell
                                            key={`scatter-cell-${entry.ticker}-${entry.value}`}
                                            fill={entry.return >= 0 ? '#10b981' : '#ef4444'}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-between px-4 text-xs text-muted-foreground sm:px-10">
                        <span>{'<'} Menor riesgo</span>
                        <span>Mayor riesgo {'>'}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
