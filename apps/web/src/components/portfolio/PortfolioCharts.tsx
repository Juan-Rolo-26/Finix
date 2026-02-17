import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const AllocationChart = ({ data, totalValue }: { data: Record<string, number>, totalValue: number }) => {
    const chartData = useMemo(() => {
        return Object.entries(data)
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                percent: (value / totalValue) * 100
            }))
            .sort((a, b) => b.value - a.value);
    }, [data, totalValue]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Distribución de Activos</CardTitle>
                <CardDescription>Composición por clase de activo</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export const TopAssetsChart = ({ data, totalValue }: { data: Record<string, number>, totalValue: number }) => {
    const chartData = useMemo(() => {
        return Object.entries(data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Top 5
            .map(([name, value]) => ({
                name,
                value,
                percent: (value / totalValue) * 100
            }));
    }, [data, totalValue]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Top 5 Activos</CardTitle>
                <CardDescription>Mayor peso en el portafolio</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                            <RechartsTooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export const CapitalEvolutionChart = ({ movements }: { movements: Array<{ fecha: string, total: number, tipoMovimiento: string }> }) => {
    const chartData = useMemo(() => {
        // Sort by date
        const sorted = [...movements].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        // Calculate cumulative cumulative capital
        let cumulative = 0;
        return sorted.map(m => {
            if (m.tipoMovimiento === 'compra') cumulative += m.total;
            if (m.tipoMovimiento === 'venta') cumulative -= m.total; // Assuming total is the transaction value
            return {
                date: new Date(m.fecha).toLocaleDateString(),
                capital: cumulative
            };
        });
    }, [movements]);

    if (chartData.length === 0) return null;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Evolución de Capital Invertido</CardTitle>
                <CardDescription>Crecimiento acumulado de depósitos</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="date" minTickGap={30} tick={{ fontSize: 12 }} opacity={0.6} />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                opacity={0.6}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Capital Acumulado']}
                            />
                            <Area
                                type="monotone"
                                dataKey="capital"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCapital)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
