import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { apiFetch } from '@/lib/api';

type HeatmapSubtype = 'd1' | 'w1' | 'ytd';

interface FinvizTickerNode {
    name: string;
    description: string;
    industry: string;
    sector: string;
    value: number;
    perf: number;
}

interface FinvizSectorNode {
    name: string;
    value: number;
    perf: number;
    children: FinvizTickerNode[];
}

interface FinvizHeatmapPayload {
    source: string;
    subtype: string;
    updatedAt: string;
    sectors: FinvizSectorNode[];
    stats: {
        tickerCount: number;
        totalMarketCap: number;
        upCount: number;
        downCount: number;
        unchangedCount: number;
        topMovers: {
            gainers: FinvizTickerNode[];
            losers: FinvizTickerNode[];
        };
    };
}

interface TreemapNodeRendererProps {
    depth?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    perf?: number | string;
    subtype?: HeatmapSubtype | string;
    children?: unknown[];
    payload?: {
        perf?: number | string;
        children?: unknown[];
        payload?: {
            perf?: number | string;
        };
    };
}

const subtypeOptions: Array<{ value: HeatmapSubtype; label: string }> = [
    { value: 'd1', label: 'Día' },
    { value: 'w1', label: 'Semana' },
    { value: 'ytd', label: 'YTD' },
];

// Paleta oficial Finviz para performance (scale "default" / DayPerf en dark theme).
const FINVIZ_PERF_COLORS = [
    '#f63538', '#ee373a', '#e6393b', '#df3a3d', '#d73c3f', '#ce3d41', '#c73e43',
    '#bf4045', '#b64146', '#ae4248', '#a5424a', '#9d434b', '#94444d', '#8b444e',
    '#824450', '#784551', '#6f4552', '#644553', '#5a4554', '#4f4554', '#414554',
    '#3f4c53', '#3d5451', '#3b5a50', '#3a614f', '#38694f', '#366f4e', '#35764e',
    '#347d4e', '#32844e', '#31894e', '#31904e', '#30974f', '#2f9e4f', '#2fa450',
    '#2faa51', '#2fb152', '#2fb854', '#30be56', '#30c558', '#30cc5a',
] as const;

const FINVIZ_NULL_COLOR = '#2f323d';

const FINVIZ_RANGE_BY_SUBTYPE: Record<HeatmapSubtype, { min: number; max: number }> = {
    // Finviz scale ids:
    // d1 -> DayPerf(default): [-3, 3]
    // w1 -> WeekPerf(_5): [-6, 6]
    // ytd -> YearPerf(_25): [-30, 30]
    d1: { min: -3, max: 3 },
    w1: { min: -6, max: 6 },
    ytd: { min: -30, max: 30 },
};

function formatPerf(perf: number) {
    return `${perf >= 0 ? '+' : ''}${perf.toFixed(2)}%`;
}

function formatMarketCap(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}T`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}B`;
    return `${Math.round(value)}M`;
}

function mapLinear(value: number, domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
    if (domainMax === domainMin) return rangeMin;
    const ratio = (value - domainMin) / (domainMax - domainMin);
    return rangeMin + ratio * (rangeMax - rangeMin);
}

function getPerfColor(perf: number, subtype: HeatmapSubtype) {
    if (!Number.isFinite(perf)) return FINVIZ_NULL_COLOR;

    const { min, max } = FINVIZ_RANGE_BY_SUBTYPE[subtype];
    const colors = FINVIZ_PERF_COLORS;
    const centerIndex = Math.floor(colors.length / 2);
    const lastIndex = colors.length - 1;

    const clamped = Math.max(Math.min(perf, max), min);
    const index = clamped < 0
        ? Math.round(mapLinear(clamped, min, 0, 0, centerIndex))
        : (clamped > 0
            ? Math.round(mapLinear(clamped, 0, max, centerIndex, lastIndex))
            : centerIndex);

    const boundedIndex = Math.max(0, Math.min(lastIndex, index));
    return colors[boundedIndex];
}

function parsePerf(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function getUpdatedLabel(updatedAt?: string) {
    if (!updatedAt) return '--:--';
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function FinvizTreemapNode({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    depth = 0,
    perf: rawPerf,
    subtype = 'd1',
    children,
    payload
}: TreemapNodeRendererProps & { [key: string]: any }) {
    if (width <= 1 || height <= 1) return null;

    // CRÍTICO: Solo los nodos de profundidad 1 son sectores, el resto son tickers
    const isSectorNode = depth === 1;

    // Recharts expone `perf` en el nodo, no siempre dentro de `payload`.
    const perf = parsePerf(rawPerf)
        ?? parsePerf(payload?.perf)
        ?? parsePerf(payload?.payload?.perf)
        ?? 0;
    const normalizedSubtype: HeatmapSubtype = subtype === 'w1' || subtype === 'ytd' ? subtype : 'd1';

    // Determine styles - Sectores con fondo oscuro, tickers con colores según performance
    const fill = isSectorNode ? 'rgba(8,15,25,0.95)' : getPerfColor(perf, normalizedSubtype);
    const stroke = isSectorNode ? '#1f2937' : 'rgba(2, 6, 23, 0.75)';
    const strokeWidth = isSectorNode ? 3 : 1.5;

    // Determine font sizes
    const primaryFontSize = Math.min(15, Math.max(9, width / 10));
    const secondaryFontSize = Math.min(13, Math.max(8, width / 14));

    // Determine visibility
    const showPrimary = width > 56 && height > 24;
    const showSecondary = width > 84 && height > 42;

    const label = String(name || '').replace(/^Root$/i, '');
    const childrenCount = Array.isArray(children)
        ? children.length
        : (Array.isArray(payload?.children) ? payload.children.length : 0);

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{ fill, stroke, strokeWidth }}
                rx={isSectorNode ? 0 : 3}
                ry={isSectorNode ? 0 : 3}
            />
            {showPrimary && (
                <text
                    x={x + 6}
                    y={y + 14}
                    fill={isSectorNode ? "#94a3b8" : "#ffffff"}
                    fontSize={primaryFontSize}
                    fontWeight={isSectorNode ? 600 : 700}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                    {label}
                </text>
            )}
            {showSecondary && !isSectorNode && (
                <text
                    x={x + 6}
                    y={y + 28}
                    fill="#ffffff"
                    fontSize={secondaryFontSize}
                    fontWeight={700}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                    {formatPerf(perf)}
                </text>
            )}
            {showSecondary && isSectorNode && (
                <text
                    x={x + 6}
                    y={y + 28}
                    fill="#64748b"
                    fontSize={secondaryFontSize}
                    fontWeight={600}
                    style={{ pointerEvents: 'none' }}
                >
                    {childrenCount} tickers
                </text>
            )}
        </g>
    );
}

export default function FinvizHeatmap() {
    const [subtype, setSubtype] = useState<HeatmapSubtype>('d1');
    const [data, setData] = useState<FinvizHeatmapPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await apiFetch(`/market/finviz/heatmap?st=${subtype}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const payload = await response.json() as FinvizHeatmapPayload;
                if (!cancelled) {
                    setData(payload);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Error desconocido');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [subtype]);

    const gainers = data?.stats?.topMovers?.gainers || [];
    const losers = data?.stats?.topMovers?.losers || [];
    const sectorCount = data?.sectors?.length || 0;

    const marketBreadth = useMemo(() => {
        if (!data?.stats?.tickerCount) return '--';
        const percentUp = (data.stats.upCount / data.stats.tickerCount) * 100;
        return `${percentUp.toFixed(1)}% en verde`;
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {subtypeOptions.map((option) => (
                        <Button
                            key={option.value}
                            size="sm"
                            variant={subtype === option.value ? 'default' : 'outline'}
                            onClick={() => setSubtype(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                        Finviz
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Actualizado: {getUpdatedLabel(data?.updatedAt)}
                    </span>
                </div>
            </div>

            <div className="h-[860px] w-full overflow-hidden rounded-xl border border-primary/30 bg-[#0a0f1a]">
                {isLoading && (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-400" />
                        <p className="text-sm text-muted-foreground">
                            No se pudo cargar el mapa de calor de Finviz ahora mismo.
                        </p>
                        <a
                            href="https://finviz.com/map.ashx?t=sec"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/10"
                        >
                            Abrir Finviz
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                )}

                {!isLoading && !error && (data?.sectors?.length || 0) > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data?.sectors}
                            dataKey="value"
                            stroke="#0f172a"
                            isAnimationActive={false}
                            content={<FinvizTreemapNode subtype={(data?.subtype as HeatmapSubtype) || subtype} />}
                        />
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Gainers</p>
                    <div className="mt-3 space-y-2">
                        {gainers.slice(0, 5).map((ticker) => (
                            <div key={`gain-${ticker.name}`} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-foreground">{ticker.name}</span>
                                <span className="text-emerald-400">{formatPerf(ticker.perf)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Losers</p>
                    <div className="mt-3 space-y-2">
                        {losers.slice(0, 5).map((ticker) => (
                            <div key={`loss-${ticker.name}`} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-foreground">{ticker.name}</span>
                                <span className="text-red-400">{formatPerf(ticker.perf)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Snapshot del Mercado</p>
                    <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Sectores</span>
                            <span className="font-semibold">{sectorCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Acciones</span>
                            <span className="font-semibold">{data?.stats?.tickerCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Capitalización total</span>
                            <span className="font-semibold">{formatMarketCap(data?.stats?.totalMarketCap || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Breadth</span>
                            <span className="font-semibold text-emerald-400">{marketBreadth}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
