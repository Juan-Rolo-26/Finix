import { useState, useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, formatPercent } from './chartUtils';
import type { AssetPerformanceDatum } from './mockData';
import { TrendingUp, TrendingDown, PieChart, BarChart3, ListFilter } from 'lucide-react';

interface AssetPerformanceChartProps {
    data: AssetPerformanceDatum[];
    className?: string;
}

type ViewMode = 'PERFORMANCE' | 'WEIGHT' | 'LIST';

export function AssetPerformanceChart({ data, className }: AssetPerformanceChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('PERFORMANCE');

    // Sanitizar datos para evitar NaN o undefined que causen pantalla blanca
    const safeData = useMemo(() => {
        return (data || []).map((d) => ({
            asset: String(d.asset || 'N/D'),
            return: Number(d.return) || 0,
            contribution: Number(d.contribution) || 0,
            weight: Math.max(0, Number(d.weight) || 0),
        }));
    }, [data]);

    // Resumen de máximos y destacados
    const summary = useMemo(() => {
        if (!safeData.length) return null;
        const sortedByReturn = [...safeData].sort((a, b) => b.return - a.return);
        const sortedByWeight = [...safeData].sort((a, b) => b.weight - a.weight);
        const topPerformer = sortedByReturn[0];
        const worstPerformer = sortedByReturn[sortedByReturn.length - 1];
        const topWeight = sortedByWeight[0];

        return {
            topPerformer,
            worstPerformer,
            topWeight,
        };
    }, [safeData]);

    // Calcular dominio Y garantizando que el 0 SIEMPRE esté visible como eje base
    const yDomain = useMemo<[number, number]>(() => {
        if (!safeData.length) return [-5, 5];

        let min = 0;
        let max = 0;

        for (const item of safeData) {
            if (item.return < min) min = item.return;
            if (item.contribution < min) min = item.contribution;
            if (item.return > max) max = item.return;
            if (item.contribution > max) max = item.contribution;
        }

        // Margen proporcional
        const padding = Math.max(2, Math.ceil(Math.max(Math.abs(min), Math.abs(max)) * 0.2));
        const domainMin = Math.floor(min - padding);
        const domainMax = Math.ceil(max + padding);

        return [domainMin, domainMax];
    }, [safeData]);

    // Custom Tooltip para el gráfico de barras
    const renderTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;

        const item = safeData.find((d) => d.asset === label);
        if (!item) return null;

        const isPositive = item.return >= 0;

        return (
            <div style={CHART_TOOLTIP_STYLE} className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                    <span className="font-heading font-black text-base text-foreground">
                        {item.asset}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        Peso: {item.weight.toFixed(1)}%
                    </span>
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm font-mono">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isPositive ? '#10b981' : '#f43f5e' }} />
                            Retorno Total:
                        </span>
                        <span className={`font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatPercent(item.return, 2, true)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                            Aporte al PnL:
                        </span>
                        <span className={`font-bold ${item.contribution >= 0 ? 'text-sky-400' : 'text-rose-300'}`}>
                            {formatPercent(item.contribution, 2, true)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className={cn('rounded-[22px] border border-border/50 bg-card/80 shadow-lg overflow-hidden flex flex-col justify-between', className)}>
            <CardHeader className="px-6 py-6 sm:px-7 sm:py-7 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Rendimiento por Activo
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground/80 mt-1">
                            Comparativa visual de retorno, aporte al capital y peso de cada posición
                        </CardDescription>
                    </div>

                    {/* Selector de modo de vista */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/40 self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('PERFORMANCE')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'PERFORMANCE'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Rendimiento
                        </button>
                        <button
                            onClick={() => setViewMode('WEIGHT')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'WEIGHT'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <PieChart className="w-3.5 h-3.5" />
                            Ponderación
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'LIST'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <ListFilter className="w-3.5 h-3.5" />
                            Detalle
                        </button>
                    </div>
                </div>

                {/* Pills resumen si hay datos */}
                {summary && (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-3 text-xs">
                        {summary.topPerformer && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Mejor: {summary.topPerformer.asset} ({formatPercent(summary.topPerformer.return, 1, true)})
                            </span>
                        )}
                        {summary.worstPerformer && summary.worstPerformer.return < 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Menor: {summary.worstPerformer.asset} ({formatPercent(summary.worstPerformer.return, 1, true)})
                            </span>
                        )}
                        {summary.topWeight && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                                Mayor peso: {summary.topWeight.asset} ({summary.topWeight.weight.toFixed(1)}%)
                            </span>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-6">
                {safeData.length === 0 ? (
                    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 text-center text-sm text-muted-foreground">
                        Este gráfico se completará cuando tu portafolio contenga posiciones con datos de cotización.
                    </div>
                ) : viewMode === 'PERFORMANCE' ? (
                    <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={safeData}
                                margin={{ top: 20, right: 16, bottom: 8, left: -10 }}
                                barGap={8}
                                barCategoryGap={safeData.length <= 2 ? '45%' : '20%'}
                            >
                                <defs>
                                    <linearGradient id="barReturnPos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                    </linearGradient>
                                    <linearGradient id="barReturnNeg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.7} />
                                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.95} />
                                    </linearGradient>
                                    <linearGradient id="barContribution" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                                <XAxis
                                    dataKey="asset"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={CHART_AXIS_TICK}
                                    tickMargin={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={CHART_AXIS_TICK}
                                    width={52}
                                    tickFormatter={(val: number) => `${val >= 0 ? '+' : ''}${val}%`}
                                    domain={yDomain}
                                    orientation="left"
                                />
                                {/* Línea cero como eje base firme */}
                                <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.45)" strokeWidth={1.5} />

                                <Legend
                                    verticalAlign="top"
                                    align="left"
                                    iconType="circle"
                                    wrapperStyle={{
                                        paddingBottom: 16,
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}
                                />
                                <RechartsTooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />

                                {/* Barra de Retorno */}
                                <Bar
                                    dataKey="return"
                                    name="Retorno del Activo (%)"
                                    maxBarSize={38}
                                    radius={[5, 5, 5, 5]}
                                >
                                    {safeData.map((entry, index) => (
                                        <Cell
                                            key={`return-cell-${index}`}
                                            fill={entry.return >= 0 ? 'url(#barReturnPos)' : 'url(#barReturnNeg)'}
                                        />
                                    ))}
                                </Bar>

                                {/* Barra de Aporte al Portafolio */}
                                <Bar
                                    dataKey="contribution"
                                    name="Aporte a la Cartera (%)"
                                    fill="url(#barContribution)"
                                    maxBarSize={38}
                                    radius={[5, 5, 5, 5]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : viewMode === 'WEIGHT' ? (
                    <div className="h-[360px] w-full flex flex-col justify-center gap-4 px-2 sm:px-6">
                        {safeData.map((item) => (
                            <div key={item.asset} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="font-heading font-black text-foreground flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        {item.asset}
                                    </span>
                                    <div className="flex items-center gap-3 font-mono">
                                        <span className="text-muted-foreground">
                                            Retorno: <span className={item.return >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                {formatPercent(item.return, 1, true)}
                                            </span>
                                        </span>
                                        <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                                            {item.weight.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                {/* Barra de progreso de peso */}
                                <div className="w-full h-3 rounded-full bg-secondary/80 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(2, item.weight))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Vista de Lista / Detalle */
                    <div className="h-[360px] w-full overflow-y-auto space-y-2.5 pr-1">
                        {safeData.map((item) => {
                            const isPositive = item.return >= 0;
                            return (
                                <div
                                    key={item.asset}
                                    className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-3 hover:bg-secondary/50 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-black text-xs ${
                                            isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                        }`}>
                                            {item.asset.slice(0, 4)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{item.asset}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Participación en cartera: <span className="text-foreground font-mono font-bold">{item.weight.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right font-mono">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Retorno</div>
                                            <div className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatPercent(item.return, 2, true)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Aporte</div>
                                            <div className={`text-sm font-bold ${item.contribution >= 0 ? 'text-sky-400' : 'text-rose-300'}`}>
                                                {formatPercent(item.contribution, 2, true)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
