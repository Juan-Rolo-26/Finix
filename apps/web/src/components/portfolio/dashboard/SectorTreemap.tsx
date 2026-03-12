import { ResponsiveContainer, Tooltip as RechartsTooltip, Treemap } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHART_TOOLTIP_STYLE, FINTECH_COLORS, formatPercent } from './chartUtils';
import type { SectorDatum } from './mockData';

interface SectorTreemapProps {
    data: SectorDatum[];
    className?: string;
}

interface TreemapContentProps {
    depth?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    name?: string;
    size?: number;
    total: number;
}

function SectorCell({ depth, x = 0, y = 0, width = 0, height = 0, index = 0, name = '', size = 0, total }: TreemapContentProps) {
    if (depth !== 1) {
        return null;
    }

    const fill = FINTECH_COLORS.treemap[index % FINTECH_COLORS.treemap.length];
    const percent = total > 0 ? (size / total) * 100 : 0;
    const canRenderLabel = width > 82 && height > 54;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={18}
                ry={18}
                fill={fill}
                stroke="rgba(15, 23, 42, 0.28)"
                strokeWidth={3}
            />
            {canRenderLabel && (
                <>
                    <text x={x + 14} y={y + 26} fill="#f8fafc" fontSize={14} fontWeight={600}>
                        {name}
                    </text>
                    <text x={x + 14} y={y + 46} fill="rgba(248, 250, 252, 0.82)" fontSize={12}>
                        {formatPercent(percent)}
                    </text>
                </>
            )}
        </g>
    );
}

export function SectorTreemap({ data, className }: SectorTreemapProps) {
    const total = data.reduce((sum, item) => sum + item.size, 0);

    return (
        <Card className={cn('border-border/70 bg-card/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)]', className)}>
            <CardHeader>
                <CardTitle className="text-lg">Asignacion por sector</CardTitle>
                <CardDescription>Mapa de exposicion por sectores y tematicas</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={data}
                                dataKey="size"
                                stroke="rgba(15, 23, 42, 0.24)"
                                content={<SectorCell total={total} />}
                            >
                                <RechartsTooltip
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: 4 }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                    formatter={(value: number, _name: string, item) => [
                                        formatPercent(total > 0 ? (value / total) * 100 : 0),
                                        item.payload.name,
                                    ]}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 text-center text-sm text-muted-foreground">
                        La exposicion sectorial aparecera cuando los activos puedan agruparse por sector o industria.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
