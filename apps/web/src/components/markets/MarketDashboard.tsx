import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Coins,
    DollarSign,
    Flame,
    Globe2,
    Landmark,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MarketDashboardAsset {
    id: string;
    symbol: string;
    label: string;
    description: string;
    format: 'currency' | 'number' | 'percent';
    currency?: 'ARS' | 'USD';
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable: boolean;
}

export interface MarketDollarRate {
    id: string;
    label: string;
    buy: number;
    sell: number;
    spreadPct: number;
    updatedAt: string;
}

export interface MarketCommunityTrend {
    symbol: string;
    label: string;
    mentions: number;
    engagement: number;
    price: number | null;
    change: number | null;
    updatedAt: string;
}

export interface MarketDashboardData {
    updatedAt: string;
    pulse: {
        label: string;
        tone: 'positive' | 'neutral' | 'negative';
        summary: string;
        advancing: number;
        declining: number;
        unchanged: number;
    };
    currencyGap: {
        label: string;
        gapPct: number;
        gapValue: number;
        officialSell: number;
        blueSell: number;
    } | null;
    dollars: MarketDollarRate[];
    sections: {
        argentina: MarketDashboardAsset[];
        global: MarketDashboardAsset[];
        crypto: MarketDashboardAsset[];
        commodities: MarketDashboardAsset[];
        indicators: MarketDashboardAsset[];
    };
    leaders: {
        gainers: MarketDashboardAsset[];
        losers: MarketDashboardAsset[];
    };
    community: MarketCommunityTrend[];
}

interface MarketDashboardProps {
    data: MarketDashboardData | null;
    loading?: boolean;
    onSelectSymbol?: (symbol: string) => void;
}

const sectionMeta = {
    argentina: {
        title: 'Argentina',
        description: 'Bolsa local, amplitud y referencias clave.',
        icon: Landmark,
        badge: 'market-section-badge market-section-badge--argentina',
    },
    global: {
        title: 'Mercados globales',
        description: 'Las referencias externas que mueven el humor del mercado.',
        icon: Globe2,
        badge: 'market-section-badge market-section-badge--global',
    },
    crypto: {
        title: 'Cripto',
        description: 'Las principales monedas digitales del tablero.',
        icon: Coins,
        badge: 'market-section-badge market-section-badge--crypto',
    },
    commodities: {
        title: 'Commodities',
        description: 'Materias primas con impacto real en la economia.',
        icon: Flame,
        badge: 'market-section-badge market-section-badge--commodities',
    },
    indicators: {
        title: 'Indicadores clave',
        description: 'Señales macro para leer riesgo, dolar y tasas.',
        icon: Activity,
        badge: 'market-section-badge market-section-badge--indicators',
    },
} as const;

const pulseToneStyles = {
    positive: 'market-pulse-card market-pulse-card--positive',
    neutral: 'market-pulse-card market-pulse-card--neutral',
    negative: 'market-pulse-card market-pulse-card--negative',
} as const;

function formatRelativeTime(value?: string) {
    if (!value) return 'Sin actualizar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actualizar';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

    if (diffMinutes < 1) return 'Hace instantes';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;

    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function formatValue(item: Pick<MarketDashboardAsset, 'format' | 'currency' | 'price'>) {
    if (item.price === null || !Number.isFinite(item.price)) {
        return 'Sin datos';
    }

    if (item.format === 'percent') {
        return `${new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: item.price < 10 ? 2 : 1,
            maximumFractionDigits: item.price < 10 ? 2 : 1,
        }).format(item.price)}%`;
    }

    if (item.format === 'currency') {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: item.currency || 'USD',
            minimumFractionDigits: item.price >= 1000 ? 0 : 2,
            maximumFractionDigits: item.price >= 1000 ? 2 : 3,
        }).format(item.price);
    }

    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: item.price >= 1000 ? 0 : 2,
        maximumFractionDigits: item.price >= 1000 ? 2 : 2,
    }).format(item.price);
}

function formatCurrency(value: number, currency: 'ARS' | 'USD') {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: value >= 1000 ? 0 : 2,
        maximumFractionDigits: value >= 1000 ? 2 : 2,
    }).format(value);
}

function formatChange(value: number | null) {
    if (value === null || !Number.isFinite(value)) return 'Sin variacion';
    const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always',
    }).format(value);
    return `${formatted}%`;
}

function formatCount(value: number) {
    return new Intl.NumberFormat('es-AR', {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value);
}

function AssetTile({
    item,
    onSelect,
}: {
    item: MarketDashboardAsset;
    onSelect?: (symbol: string) => void;
}) {
    const positive = (item.change ?? 0) > 0;
    const negative = (item.change ?? 0) < 0;
    const clickable = Boolean(onSelect);

    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
                <div
                    className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-xl border',
                        positive
                            ? 'market-trend-chip market-trend-chip--positive'
                            : negative
                                ? 'market-trend-chip market-trend-chip--negative'
                                : 'border-border/60 bg-background/50 text-muted-foreground'
                    )}
                >
                    {positive ? <ArrowUpRight className="h-4 w-4" /> : negative ? <ArrowDownRight className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                </div>
            </div>

            <div className="mt-5 space-y-2">
                <p className="text-2xl font-bold tracking-tight text-foreground">{formatValue(item)}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                        className={cn(
                            'text-sm font-semibold',
                            positive ? 'market-tone-positive' : negative ? 'market-tone-negative' : 'text-muted-foreground'
                        )}
                    >
                        {formatChange(item.change)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(item.updatedAt)}</span>
                </div>
            </div>
        </>
    );

    if (clickable) {
        return (
            <button
                type="button"
                onClick={() => onSelect?.(item.symbol)}
                className="rounded-[24px] border border-border/60 bg-background/30 p-5 text-left transition-all hover:border-primary/30 hover:bg-background/50"
            >
                {content}
            </button>
        );
    }

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/30 p-5">
            {content}
        </div>
    );
}

function DollarTile({ item }: { item: MarketDollarRate }) {
    const isUp = (item.spreadPct ?? 0) >= 0;
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/35 p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Actualizacion {formatRelativeTime(item.updatedAt).toLowerCase()}</p>
                </div>
                <Badge
                    variant="outline"
                    className="border-0 text-xs font-bold tracking-wide"
                    style={{
                        background: isUp ? 'hsl(142 70% 45% / 0.12)' : 'hsl(0 72% 50% / 0.12)',
                        color: isUp ? 'hsl(142 70% 35%)' : 'hsl(0 72% 45%)',
                    }}
                >
                    {formatChange(item.spreadPct)}
                </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Compra</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(item.buy, 'ARS')}</p>
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Venta</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(item.sell, 'ARS')}</p>
                </div>
            </div>
        </div>
    );
}



function SectionCard({
    sectionKey,
    items,
    onSelectSymbol,
}: {
    sectionKey: keyof MarketDashboardData['sections'];
    items: MarketDashboardAsset[];
    onSelectSymbol?: (symbol: string) => void;
}) {
    const meta = sectionMeta[sectionKey];
    const Icon = meta.icon;

    return (
        <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Icon className="h-5 w-5 text-primary" />
                            {meta.title}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm">{meta.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={meta.badge}>{items.length} items</Badge>
                </div>
            </CardHeader>
            <CardContent className="grid gap-5 md:gap-6 sm:grid-cols-2">
                {items.map((item) => (
                    <AssetTile key={item.id} item={item} onSelect={onSelectSymbol} />
                ))}
            </CardContent>
        </Card>
    );
}

function LoadingState() {
    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`summary-skeleton-${index}`} className="h-40 animate-pulse rounded-[30px] border border-border/60 bg-card/60" />
                ))}
            </div>
            <div className="h-56 animate-pulse rounded-[30px] border border-border/60 bg-card/60" />
            <div className="grid gap-8 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`section-skeleton-${index}`} className="h-[420px] animate-pulse rounded-[30px] border border-border/60 bg-card/60" />
                ))}
            </div>
        </div>
    );
}

export default function MarketDashboard({ data, loading = false, onSelectSymbol }: MarketDashboardProps) {
    if (loading && !data) {
        return <LoadingState />;
    }

    if (!data) {
        return (
            <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                <CardContent className="px-6 py-12 text-center text-muted-foreground">
                    No pudimos cargar el panel del mercado en este momento.
                </CardContent>
            </Card>
        );
    }

    const pulseToneClass = pulseToneStyles[data.pulse.tone];
    const topGainer = data.leaders.gainers[0] || null;
    const topCommunity = data.community[0] || null;

    return (
        <div className="space-y-8 xl:space-y-10">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Card className={cn('rounded-[30px] border backdrop-blur-xl', pulseToneClass)}>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5" />
                            Pulso del mercado
                        </CardTitle>
                        <CardDescription className="market-pulse-subtle !text-current">Lectura rapida de la jornada</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-2xl font-bold">{data.pulse.label}</p>
                        <p className="market-pulse-subtle text-sm">{data.pulse.summary}</p>
                        <div className="market-pulse-subtle flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                            <span>{data.pulse.advancing} arriba</span>
                            <span>{data.pulse.declining} abajo</span>
                            <span>{data.pulse.unchanged} neutros</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Brecha cambiaria
                        </CardTitle>
                        <CardDescription>Dolar blue vs oficial</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-2xl font-bold text-foreground">
                            {data.currencyGap ? formatChange(data.currencyGap.gapPct) : 'Sin datos'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {data.currencyGap
                                ? `${formatCurrency(data.currencyGap.gapValue, 'ARS')} de diferencia entre venta blue y oficial.`
                                : 'No hay suficientes datos para calcular la brecha.'}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                            Actualizado {formatRelativeTime(data.updatedAt).toLowerCase()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Mejor rendimiento
                        </CardTitle>
                        <CardDescription>Mayor suba dentro del tablero seguido</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topGainer ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onSelectSymbol?.(topGainer.symbol)}
                                    className="text-left transition-colors hover:text-primary"
                                >
                                    <p className="text-2xl font-bold text-foreground">{topGainer.label}</p>
                                </button>
                                <p className="market-tone-positive text-sm font-semibold">{formatChange(topGainer.change)}</p>
                                <p className="text-sm text-muted-foreground">{topGainer.description}</p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin datos para calcular lideres.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" />
                            Radar Finix
                        </CardTitle>
                        <CardDescription>Lo mas comentado por la comunidad</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topCommunity ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onSelectSymbol?.(topCommunity.symbol)}
                                    className="text-left transition-colors hover:text-primary"
                                >
                                    <p className="text-2xl font-bold text-foreground">{topCommunity.label}</p>
                                </button>
                                <p className="text-sm text-muted-foreground">
                                    {formatCount(topCommunity.mentions)} menciones y {formatCount(topCommunity.engagement)} interacciones.
                                </p>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                                    Comunidad destacada esta semana
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Todavia no hay suficiente conversacion para armar el radar social.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                <CardHeader className="pb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl">Dolar hoy</CardTitle>
                            <CardDescription className="mt-2 text-base">
                                Tipos de cambio clave para seguir Argentina en segundos.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-border/60 bg-background/50 uppercase tracking-[0.18em]">
                            {data.dollars.length} referencias
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {data.dollars.map((item) => (
                        <DollarTile key={item.id} item={item} />
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-8 xl:grid-cols-2">
                <SectionCard sectionKey="argentina" items={data.sections.argentina} onSelectSymbol={onSelectSymbol} />
                <SectionCard sectionKey="global" items={data.sections.global} onSelectSymbol={onSelectSymbol} />
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
                <SectionCard sectionKey="crypto" items={data.sections.crypto} onSelectSymbol={onSelectSymbol} />
                <SectionCard sectionKey="commodities" items={data.sections.commodities} onSelectSymbol={onSelectSymbol} />
            </div>

            <div className="grid gap-8">
                <SectionCard sectionKey="indicators" items={data.sections.indicators} onSelectSymbol={onSelectSymbol} />
            </div>
        </div>
    );
}
