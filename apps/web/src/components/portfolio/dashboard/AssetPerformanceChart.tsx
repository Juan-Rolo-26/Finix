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
import { resolveAssetInfo } from '@/lib/tradingview';
import { SymbolLogo } from '@/components/SymbolLogo';
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
        return (data || []).map((d) => {
            const asset = String(d.asset || 'N/D');
            const suppliedName = String(d.name || '').trim();
            const name = suppliedName && suppliedName.toLowerCase() !== asset.toLowerCase()
                ? suppliedName
                : resolveAssetInfo(asset).displayName;

            return {
                asset,
                symbol: String(d.symbol || asset),
                name,
                return: Number(d.return) || 0,
                contribution: Number(d.contribution) || 0,
                weight: Math.max(0, Number(d.weight) || 0),
            };
        });
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

    // Ajustar el dominio al rango real evita que una posición con variación
    // pequeña quede perdida en un gráfico con demasiado espacio vacío.
    const yDomain = useMemo<[number, number]>(() => {
        if (!safeData.length) return [-5, 5];

        const values = safeData.flatMap((item) => [item.return, item.contribution]);
        const min = Math.min(0, ...values);
        const max = Math.max(0, ...values);
        const maxAbs = Math.max(Math.abs(min), Math.abs(max), 0.4);
        const padding = Math.max(maxAbs * 0.28, 0.12);

        const domainMin = Number((min - padding).toFixed(2));
        const domainMax = Number((max + padding).toFixed(2));

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
                    <span className="min-w-0">
                        <span className="block max-w-[200px] truncate font-heading font-black text-base text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">{item.asset}</span>
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
        <Card className={cn('min-w-0 rounded-[22px] border border-border/50 bg-card/80 shadow-sm overflow-hidden flex flex-col', className)}>
            <CardHeader className="px-4 py-5 sm:px-6 sm:py-6 border-b border-border/40 text-center">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="flex flex-col items-center text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2.5 text-center">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Rendimiento por Activo
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground/80 mt-1 text-center max-w-md mx-auto">
                            Retorno, aporte y peso actual de cada posición
                        </CardDescription>
                    </div>

                    {/* Selector de modo de vista */}
                    <div className="flex max-w-full items-center justify-center gap-1 overflow-x-auto p-1 rounded-xl bg-secondary/50 border border-border/40">
                        <button
                            onClick={() => setViewMode('PERFORMANCE')} aria-pressed={viewMode === 'PERFORMANCE'}
                            className={`flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'PERFORMANCE'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Rendimiento
                        </button>
                        <button
                            onClick={() => setViewMode('WEIGHT')} aria-pressed={viewMode === 'WEIGHT'}
                            className={`flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'WEIGHT'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <PieChart className="w-3.5 h-3.5" />
                            Ponderación
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')} aria-pressed={viewMode === 'LIST'}
                            className={`flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
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
                    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pt-3 text-xs">
                        {summary.topPerformer && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Mejor: {summary.topPerformer.name || summary.topPerformer.asset} ({formatPercent(summary.topPerformer.return, 1, true)})
                            </span>
                        )}
                        {summary.worstPerformer && summary.worstPerformer.return < 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Menor: {summary.worstPerformer.name || summary.worstPerformer.asset} ({formatPercent(summary.worstPerformer.return, 1, true)})
                            </span>
                        )}
                        {summary.topWeight && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                                Mayor peso: {summary.topWeight.name || summary.topWeight.asset} ({summary.topWeight.weight.toFixed(1)}%)
                            </span>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col px-4 pt-4 pb-5 sm:px-6 sm:pt-5">
                {safeData.length === 0 ? (
                    <div className="flex h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-secondary/15 px-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-foreground">Sin posiciones para comparar</h4>
                            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                                Agregá transacciones a tu portafolio para visualizar el retorno, el aporte al capital y el peso relativo de cada activo.
                            </p>
                        </div>
                    </div>
                ) : viewMode === 'PERFORMANCE' ? (
                    <div className="h-[320px] min-h-[320px] flex-1 w-full overflow-x-auto sm:min-h-[390px]">
                      <div className="h-full" style={{ minWidth: Math.max(280, safeData.length * 96) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                            accessibilityLayer
                                data={safeData}
                                margin={{ top: 20, right: 16, bottom: 8, left: -10 }}
                                barGap={8}
                                maxBarSize={48}
                                barCategoryGap={safeData.length === 1 ? '58%' : safeData.length <= 2 ? '42%' : '20%'}
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
                                    tick={{ ...CHART_AXIS_TICK, fontSize: 13 }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ ...CHART_AXIS_TICK, fontSize: 13 }}
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
                                    {safeData.map((entry) => (
                                        <Cell
                                            key={`return-cell-${entry.symbol}`}
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
                    </div>
                ) : viewMode === 'WEIGHT' ? (
                    <div className="min-h-[300px] w-full flex flex-col justify-center gap-4 px-1 sm:min-h-[340px] sm:px-4">
                        {safeData.map((item) => (
                            <div key={item.asset} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="font-heading font-black text-foreground flex min-w-0 items-center gap-2">
                                        <SymbolLogo symbol={item.symbol} size={24} className="shrink-0" />
                                        <span className="truncate">{item.name}</span>
                                        <span className="shrink-0 font-normal text-muted-foreground">({item.asset})</span>
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
                    <div className="min-h-[300px] max-h-[360px] w-full overflow-y-auto space-y-2.5 pr-1 sm:min-h-[340px]">
                        {safeData.map((item) => {
                            const isPositive = item.return >= 0;
                            return (
                                <div
                                    key={item.asset}
                                    className="p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-all"
                                >
                                    {/* Top row: icon + name + ticker */}
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <SymbolLogo symbol={item.symbol} size={34} className="shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-foreground text-sm leading-tight truncate">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.asset} · {item.weight.toFixed(1)}% del portafolio</div>
                                        </div>
                                    </div>
                                    {/* Bottom row: retorno + aporte side by side */}
                                    <div className="flex items-center gap-3 font-mono pl-11">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-muted-foreground uppercase tracking-wider">Retorno</div>
                                            <div className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatPercent(item.return, 2, true)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-muted-foreground uppercase tracking-wider">Aporte</div>
                                            <div className={`text-sm font-bold ${item.contribution >= 0 ? 'text-sky-400' : 'text-rose-300'}`}>
                                                {formatPercent(item.contribution, 2, true)}
                                            </div>
                                        </div>
                                        <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 text-xs shrink-0">
                                            {item.weight.toFixed(1)}%
                                        </span>
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
