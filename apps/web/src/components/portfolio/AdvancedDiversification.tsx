import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

export const PortfolioAdvancedMetrics = ({
    // metrics
    assets
}: {
    metrics: any;
    assets: any[];
}) => {

    // Treemap / Bar Chart complex data
    const assetsByClass = useMemo(() => {
        const result: Record<string, { value: number; count: number; items: any[] }> = {};

        assets.forEach(asset => {
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
                profitPct: asset.montoInvertido > 0 ? ((value - asset.montoInvertido) / asset.montoInvertido) * 100 : 0
            });
        });

        return Object.entries(result).map(([name, data]) => ({
            name,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [assets]);

    // Risk / Return scatter plot data
    const scatterData = useMemo(() => {
        return assets.map(asset => {
            const currentPrice = asset.precioActual ?? asset.ppc;
            const value = currentPrice * asset.cantidad;
            const profitPct = asset.montoInvertido > 0 ? ((value - asset.montoInvertido) / asset.montoInvertido) * 100 : 0;

            // Simulating risk based on asset class if we don't have it
            let simulatedRisk = 50;
            if (asset.tipoActivo.toLowerCase().includes('cripto')) simulatedRisk = 90;
            if (asset.tipoActivo.toLowerCase().includes('accion')) simulatedRisk = 70;
            if (asset.tipoActivo.toLowerCase().includes('bono') || asset.tipoActivo.toLowerCase().includes('fijo')) simulatedRisk = 20;

            return {
                ticker: asset.ticker,
                return: profitPct,
                risk: simulatedRisk,
                value: value
            };
        });
    }, [assets]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Concentración</CardTitle>
                        <CardDescription>Top 3 activos vs resto</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={(() => {
                                            const sorted = [...assets].map(a => {
                                                const currentPrice = a.precioActual ?? a.ppc;
                                                return {
                                                    name: a.ticker,
                                                    value: currentPrice * a.cantidad
                                                };
                                            }).sort((a, b) => b.value - a.value);

                                            const top3 = sorted.slice(0, 3);
                                            const restValue = sorted.slice(3).reduce((acc, curr) => acc + curr.value, 0);

                                            if (restValue > 0) {
                                                return [...top3, { name: 'Resto', value: restValue }];
                                            }
                                            return top3;
                                        })()}
                                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        paddingAngle={2} dataKey="value"
                                    >
                                        {(() => {
                                            const sorted = [...assets].sort((a, b) => (b.precioActual ?? b.ppc) * b.cantidad - (a.precioActual ?? a.ppc) * a.cantidad);
                                            const result = sorted.slice(0, 3).map((_, i) => <Cell key={i} fill={COLORS[i]} />);
                                            if (sorted.length > 3) result.push(<Cell key="resto" fill="#4b5563" />);
                                            return result;
                                        })()}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(val: number) => [`$${val.toFixed(2)}`, 'Valor']}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Composición Detallada por Clase</CardTitle>
                        <CardDescription>Valor aportado por categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assetsByClass} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} opacity={0.7} />
                                    <YAxis tickFormatter={(val) => `$${val > 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} tick={{ fontSize: 12 }} opacity={0.7} width={60} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
                                        formatter={(val: number) => [`$${val.toFixed(2)}`, 'Total']}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {assetsByClass.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    <CardDescription>Análisis de riesgo y retorno por cada activo del portafolio</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" dataKey="risk" name="Riesgo Estimado" unit=" pts" domain={[0, 100]} stroke="#6b7280" />
                                <YAxis type="number" dataKey="return" name="Rentabilidad" unit="%" stroke="#6b7280" />
                                <ZAxis type="number" dataKey="value" range={[60, 400]} name="Valor" />
                                <RechartsTooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '8px' }}
                                    formatter={(value, name) => {
                                        if (name === 'Rentabilidad') return [`${Number(value).toFixed(2)}%`, name];
                                        if (name === 'Valor') return [`$${Number(value).toFixed(2)}`, name];
                                        return [value, name];
                                    }}
                                />
                                <Scatter name="Activos" data={scatterData} fill="#3b82f6" fillOpacity={0.7}>
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-4 px-10">
                        <span>← Menor Riesgo</span>
                        <span>Mayor Riesgo →</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
