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
    { value: 'ytd', label: 'Ano corrido' },
];

const FINVIZ_NULL_COLOR = '#2f323d';

const FINVIZ_RANGE_BY_SUBTYPE: Record<HeatmapSubtype, { min: number; max: number }> = {
    // Finviz scale adjusted for visual balance
    d1: { min: -3, max: 3 },
    w1: { min: -6, max: 6 },
    ytd: { min: -25, max: 25 },
};

function formatPerf(perf: number) {
    return `${perf >= 0 ? '+' : ''}${perf.toFixed(2)}%`;
}

function formatMarketCap(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}T`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}B`;
    return `${Math.round(value)}M`;
}

// Function to interpolate colors for smoother gradients
function interpolateColor(color1: string, color2: string, factor: number) {
    if (arguments.length < 3) { factor = 0.5; }
    const result = color1.slice(1).match(/.{2}/g)!.map((hex, i) => {
        return Math.round(parseInt(hex, 16) + factor * (parseInt(color2.slice(1).match(/.{2}/g)![i], 16) - parseInt(hex, 16)));
    });
    return `#${result.map(val => val.toString(16).padStart(2, '0')).join('')}`;
}

function getPerfColor(perf: number, subtype: HeatmapSubtype) {
    if (!Number.isFinite(perf)) return FINVIZ_NULL_COLOR;

    const { min, max } = FINVIZ_RANGE_BY_SUBTYPE[subtype];

    // Normalize performance to 0-1 range relative to min/max
    let normalized = (Math.max(Math.min(perf, max), min) - min) / (max - min);

    // Key color points in the 0-1 range
    // 0.0 (Min) -> Red (#F63538)
    // 0.33 -> Dark Red (#8B444E)
    // 0.5 -> Neutral (#414554)
    // 0.66 -> Dark Green (#35764E)
    // 1.0 (Max) -> Bright Green (#30CC5A)

    const points = [
        { pos: 0.0, color: '#F63538' }, // Bright Red
        { pos: 0.25, color: '#BF4045' }, // Red
        { pos: 0.40, color: '#5e3a3f' }, // Dark Red/Grey
        { pos: 0.5, color: '#414554' },  // Neutral Grey
        { pos: 0.60, color: '#2f4b36' }, // Dark Green/Grey
        { pos: 0.75, color: '#2F9E4F' }, // Green
        { pos: 1.0, color: '#30CC5A' }   // Bright Green
    ];

    // Find the segment
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        if (normalized >= curr.pos && normalized <= next.pos) {
            const range = next.pos - curr.pos;
            const factor = (normalized - curr.pos) / range;
            return interpolateColor(curr.color, next.color, factor);
        }
    }
    return points[points.length - 1].color;
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
    payload
}: TreemapNodeRendererProps & { [key: string]: any }) {
    // Manual gap calculation
    const GAP = 2; // px
    const adjustedX = x + GAP / 2;
    const adjustedY = y + GAP / 2;
    const adjustedWidth = width - GAP;
    const adjustedHeight = height - GAP;

    if (adjustedWidth <= 0 || adjustedHeight <= 0) return null;

    // CRÍTICO: Solo los nodos de profundidad 1 son sectores, el resto son tickers
    const isSectorNode = depth === 1;

    // Recharts expone `perf` en el nodo, no siempre dentro de `payload`.
    const perf = parsePerf(rawPerf)
        ?? parsePerf(payload?.perf)
        ?? parsePerf(payload?.payload?.perf)
        ?? 0;
    const normalizedSubtype: HeatmapSubtype = subtype === 'w1' || subtype === 'ytd' ? subtype : 'd1';

    // Determine styles - Sectores con fondo oscuro, tickers con colores según performance
    const fill = isSectorNode ? 'transparent' : getPerfColor(perf, normalizedSubtype); // Make sectors transparent to show background/stroke only
    const stroke = isSectorNode ? '#334155' : 'rgba(0,0,0,0.1)';
    const strokeWidth = isSectorNode ? 2 : 1;

    // Font Sizing - slightly larger for better readability
    const primaryFontSize = Math.min(18, Math.max(10, Math.min(width, height) / 4));
    const secondaryFontSize = Math.min(14, Math.max(9, Math.min(width, height) / 6));

    // Visibility Logic
    const showPrimary = width > 40 && height > 20;
    const showSecondary = width > 60 && height > 35;

    const label = String(name || '').replace(/^Root$/i, '');

    return (
        <g>
            <rect
                x={adjustedX}
                y={adjustedY}
                width={adjustedWidth}
                height={adjustedHeight}
                style={{ fill, stroke, strokeWidth }}
                rx={isSectorNode ? 4 : 2}
                ry={isSectorNode ? 4 : 2}
            />

            {isSectorNode && width > 50 && height > 20 && (
                <text
                    x={adjustedX + 4}
                    y={adjustedY + 16}
                    fill="#94a3b8"
                    fontSize={12}
                    fontWeight={700}
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                >
                    {label}
                </text>
            )}

            {!isSectorNode && showPrimary && (
                <text
                    x={adjustedX + adjustedWidth / 2}
                    y={showSecondary ? adjustedY + adjustedHeight / 2 - secondaryFontSize / 2 - 2 : adjustedY + adjustedHeight / 2 + primaryFontSize / 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={primaryFontSize}
                    fontWeight={700}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                >
                    {label}
                </text>
            )}

            {!isSectorNode && showSecondary && (
                <text
                    x={adjustedX + adjustedWidth / 2}
                    y={adjustedY + adjustedHeight / 2 + secondaryFontSize / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff" // Always white for contrast on colored bg
                    fontSize={secondaryFontSize}
                    fontWeight={600}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                >
                    {formatPerf(perf)}
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

            <div className="h-[860px] w-full overflow-hidden rounded-xl border border-primary/30 bg-[#020617] shadow-xl">
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
                            stroke="rgba(0,0,0,0)"
                            isAnimationActive={false}
                            content={<FinvizTreemapNode subtype={(data?.subtype as HeatmapSubtype) || subtype} />}
                            style={{ background: 'transparent' }}
                        />
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mayores subas</p>
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mayores bajas</p>
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Panorama del mercado</p>
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
                            <span className="text-muted-foreground">Amplitud</span>
                            <span className="font-semibold text-emerald-400">{marketBreadth}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
