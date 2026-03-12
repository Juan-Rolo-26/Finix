import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#6366f1', '#ec4899', '#84cc16', '#f97316'];

const TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: 'hsl(var(--popover) / 0.97)',
    border: '1px solid hsl(var(--border) / 0.8)',
    borderRadius: '14px',
    color: 'hsl(var(--popover-foreground))',
    boxShadow: '0 16px 40px hsl(var(--foreground) / 0.08), 0 2px 8px hsl(var(--foreground) / 0.04)',
    padding: '12px 16px',
    fontSize: '13px',
    fontFamily: '"Satoshi", system-ui, sans-serif',
    lineHeight: '1.5',
    minWidth: '160px',
};

type PortfolioAsset = {
    ticker: string;
    tipoActivo: string;
    montoInvertido: number;
    ppc: number;
    cantidad: number;
    precioActual?: number;
};

type PortfolioMetrics = {
    cashBalance?: number;
    diversificacionPorClase?: Record<string, number>;
};

type DistributionEntry = {
    name: string;
    value: number;
    share: number;
    color: string;
};

type PieLabelProps = {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    x?: number;
    y?: number;
    name?: string;
    percent?: number;
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

function truncateLabel(value: string, maxLength = 24) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}…`;
}

function normalizeAssetType(value?: string) {
    const normalized = String(value || '').trim().toLowerCase();

    if (normalized.includes('cedear')) return 'Acciones';
    if (normalized.includes('accion') || normalized.includes('stock') || normalized.includes('equity')) return 'Acciones';
    if (normalized.includes('cripto') || normalized.includes('crypto')) return 'Cripto';
    if (normalized.includes('etf')) return 'ETFs';
    if (normalized.includes('bond') || normalized.includes('bono') || normalized.includes('fijo') || normalized.includes('fija') || normalized.includes('renta fija')) return 'Bonos';
    if (normalized.includes('cash') || normalized.includes('efectivo')) return 'Efectivo';

    return value || 'Otros';
}

function getAssetValue(asset: PortfolioAsset) {
    const currentPrice = asset.precioActual ?? asset.ppc;
    return currentPrice * asset.cantidad;
}

function buildDistribution(
    assets: PortfolioAsset[],
    getKey: (asset: PortfolioAsset) => string,
) {
    const totals = assets.reduce<Record<string, number>>((acc, asset) => {
        const name = getKey(asset);
        const value = getAssetValue(asset);
        if (!name || value <= 0) return acc;

        acc[name] = (acc[name] ?? 0) + value;
        return acc;
    }, {});

    const totalValue = Object.values(totals).reduce((acc, value) => acc + value, 0);

    return Object.entries(totals)
        .map(([name, value], index) => ({
            name,
            value,
            share: totalValue > 0 ? (value / totalValue) * 100 : 0,
            color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
}

function renderPieLabel({ cx = 0, x = 0, y = 0, name = '', percent = 0 }: PieLabelProps) {
    const textAnchor = x >= cx ? 'start' : 'end';
    const safePercent = Math.min(percent * 100, 100);

    return (
        <text x={x} y={y} fill="rgba(71, 85, 105, 0.95)" textAnchor={textAnchor}>
            <tspan x={x} dy="-0.25em" fontSize="12" fontWeight={600}>
                {truncateLabel(name, 22)}
            </tspan>
            <tspan x={x} dy="1.35em" fontSize="11" fill="rgba(100, 116, 139, 0.95)">
                {formatPercent(safePercent)}
            </tspan>
        </text>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/20 px-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}

function DistributionCard({
    title,
    description,
    summary,
    data,
    emptyMessage,
}: {
    title: string;
    description: string;
    summary: string;
    data: DistributionEntry[];
    emptyMessage: string;
}) {
    return (
        <Card className="border-border shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="space-y-3">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-foreground/85">{summary}</p>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyState message={emptyMessage} />
                ) : (
                    <div className="space-y-6">
                        <div className="h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 18, right: 80, bottom: 18, left: 80 }}>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={108}
                                        innerRadius={0}
                                        paddingAngle={data.length === 1 ? 0 : 4}
                                        stroke={data.length === 1 ? 'none' : 'hsl(var(--card))'}
                                        strokeWidth={data.length === 1 ? 0 : 4}
                                        labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.2 }}
                                        label={renderPieLabel}
                                        isAnimationActive={false}
                                    >
                                        {data.map((entry) => (
                                            <Cell
                                                key={`${title}-${entry.name}-${entry.value}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Valor actual']}
                                        contentStyle={TOOLTIP_STYLE}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            {data.map((entry) => (
                                <div
                                    key={`${title}-legend-${entry.name}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="truncate text-sm text-foreground/90">{entry.name}</span>
                                    </div>
                                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                                        {formatCompactCurrency(entry.value)} · {formatPercent(entry.share)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export const PortfolioAdvancedMetrics = ({
    metrics,
    assets,
}: {
    metrics?: PortfolioMetrics | null;
    assets: PortfolioAsset[];
}) => {
    const allocationByType = useMemo(
        () => {
            if (metrics?.diversificacionPorClase) {
                return Object.entries(metrics.diversificacionPorClase)
                    .filter(([, value]) => value > 0)
                    .map(([name, value], index) => ({
                        name: normalizeAssetType(name),
                        value,
                        share: 0,
                        color: COLORS[index % COLORS.length],
                    }))
                    .sort((left, right) => right.value - left.value)
                    .map((entry, _index, source) => {
                        const totalValue = source.reduce((total, item) => total + item.value, 0);
                        return {
                            ...entry,
                            share: totalValue > 0 ? (entry.value / totalValue) * 100 : 0,
                        };
                    });
            }

            return buildDistribution(assets, (asset) => normalizeAssetType(asset.tipoActivo));
        },
        [assets, metrics?.diversificacionPorClase],
    );

    const allocationByAsset = useMemo(
        () => buildDistribution(assets, (asset) => String(asset.ticker || '').trim().toUpperCase()),
        [assets],
    );

    const largestType = allocationByType[0];
    const largestAsset = allocationByAsset[0];

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DistributionCard
                title="Diversificacion por tipo de activo"
                description="Peso real de cada tipo dentro del portafolio"
                summary={largestType
                    ? `La mayor exposicion hoy esta en ${largestType.name} con ${formatPercent(largestType.share)} del valor total del portafolio.`
                    : 'Todavia no hay posiciones con valor suficiente para calcular la distribucion por tipo.'}
                data={allocationByType}
                emptyMessage="Todavia no hay posiciones suficientes para mostrar la distribucion por tipo de activo."
            />

            <DistributionCard
                title="Diversificacion por activo"
                description="Distribucion individual de todas las posiciones"
                summary={largestAsset
                    ? `La posicion con mas peso es ${largestAsset.name} con ${formatPercent(largestAsset.share)} del valor actual del portafolio.`
                    : 'Todavia no hay posiciones con valor suficiente para calcular la distribucion por activo.'}
                data={allocationByAsset}
                emptyMessage="Todavia no hay posiciones suficientes para mostrar la distribucion individual por activo."
            />
        </div>
    );
};
