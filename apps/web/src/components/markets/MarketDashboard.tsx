import { MarketDashboardGrid } from './MarketDashboardGrid';
import {
    Activity,
    Clock,
    Coins,
    DollarSign,
    Flame,
    Globe2,
    Landmark,
    RotateCw,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';

import {
    MarketHeader,
    MarketQuoteCard,
    MarketSectionTitle,
} from './MarketPrimitives';

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
    onRefresh?: () => void;
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
        description:
            'Las referencias externas que mueven el humor del mercado.',
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

function formatValue(
    item: Pick<MarketDashboardAsset, 'format' | 'currency' | 'price'>,
) {
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
    quoteLabel,
}: {
    item: MarketDashboardAsset;
    onSelect?: (symbol: string) => void;
    quoteLabel?: string;
}) {
    return (
        <MarketQuoteCard
            symbol={item.symbol}
            label={item.label}
            value={formatValue(item)}
            change={item.unavailable ? null : item.change}
            quoteLabel={quoteLabel}
            unit={item.currency}
            footer={formatRelativeTime(item.updatedAt)}
            footerRight={item.description}
            onSelect={onSelect ? () => onSelect(item.symbol) : undefined}
        />
    );
}

interface DollarConfig {
    name: string;
    tag: string;
    subtitle: string;
    badgeStyle: string;
    iconBg: string;
    icon: typeof Landmark;
}

const DOLLAR_CONFIGS: Record<string, DollarConfig> = {
    oficial: {
        name: 'Dólar Oficial',
        tag: 'BNA',
        subtitle: 'Banco Nación · Minorista',
        badgeStyle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        icon: Landmark,
    },
    blue: {
        name: 'Dólar Blue',
        tag: 'Libre',
        subtitle: 'Mercado Paralelo',
        badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        icon: Flame,
    },
    mep: {
        name: 'Dólar MEP',
        tag: 'Bolsa',
        subtitle: 'Bono AL30 / GD30',
        badgeStyle: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        icon: TrendingUp,
    },
    ccl: {
        name: 'Dólar CCL',
        tag: 'Cable',
        subtitle: 'Contado con Liquidación',
        badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        icon: Globe2,
    },
    mayorista: {
        name: 'Dólar Mayorista',
        tag: 'Mayorista',
        subtitle: 'Mercado mayorista · ARS',
        badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        icon: Landmark,
    },
    tarjeta: {
        name: 'Dólar Tarjeta',
        tag: 'Tarjeta',
        subtitle: 'Referencia del proveedor · ARS',
        badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        icon: DollarSign,
    },
};

const defaultDollarConfig: DollarConfig = {
    name: 'Dólar',
    tag: 'Cotización',
    subtitle: 'Tipo de cambio · ARS',
    badgeStyle: 'bg-primary/10 text-primary border-primary/20',
    iconBg: 'bg-primary/10 text-primary',
    icon: DollarSign,
};

function DollarTile({ item }: { item: MarketDollarRate }) {
    const key = (item.id || item.label || '').toLowerCase();
    const config = DOLLAR_CONFIGS[key] || {
        ...defaultDollarConfig,
        name: `Dólar ${item.label}`,
    };
    const Icon = config.icon;
    const spreadFormatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    }).format(item.spreadPct);

    return (
        <article className="dollar-card">
            <div className="dollar-card__header">
                <div className="dollar-card__identity">
                    <span className={`dollar-card__icon ${config.iconBg}`}>
                        <Icon size={19} />
                    </span>
                    <div className="dollar-card__titles">
                        <span className="dollar-card__name">
                            {config.name}
                        </span>
                        <span className="dollar-card__subtitle">
                            {config.subtitle}
                        </span>
                    </div>
                </div>
                <span className={`dollar-card__badge ${config.badgeStyle}`}>
                    {config.tag}
                </span>
            </div>

            <div className="dollar-card__rates">
                <div className="dollar-card__rate-box">
                    <span className="dollar-card__rate-label">Compra</span>
                    <span className="dollar-card__rate-val">
                        {formatCurrency(item.buy, 'ARS')}
                    </span>
                </div>
                <div className="dollar-card__divider" />
                <div className="dollar-card__rate-box dollar-card__rate-box--sell">
                    <span className="dollar-card__rate-label dollar-card__rate-label--sell">
                        Venta
                    </span>
                    <span className="dollar-card__rate-val dollar-card__rate-val--sell">
                        {formatCurrency(item.sell, 'ARS')}
                    </span>
                </div>
            </div>

            <div className="dollar-card__footer">
                <span className="dollar-card__time">
                    <Clock size={12} className="opacity-60" />
                    {formatRelativeTime(item.updatedAt)}
                </span>
                <span className="dollar-card__spread">
                    Spread {spreadFormatted}%
                </span>
            </div>
        </article>
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
    return (
        <section>
            <MarketSectionTitle
                title={meta.title}
                icon={meta.icon}
                count={`${items.length} activos`}
            />
            <MarketDashboardGrid>
                {items.map((item) => (
                    <AssetTile
                        key={item.id}
                        item={item}
                        onSelect={onSelectSymbol}
                    />
                ))}
            </MarketDashboardGrid>
            {!items.length && (
                <p className="market-empty">Sin cotizaciones disponibles.</p>
            )}
        </section>
    );
}

export default function MarketDashboard({
    data,
    loading = false,
    onSelectSymbol,
    onRefresh,
}: MarketDashboardProps) {
    if (loading && !data)
        return (
            <div className="market-section">
                <MarketDashboardGrid
                    role="status"
                    aria-label="Cargando mercado"
                >
                    {Array.from({ length: 6 }, (_, index) => (
                        <div
                            key={index}
                            className="market-quote-card animate-pulse"
                        />
                    ))}
                </MarketDashboardGrid>
            </div>
        );
    if (!data)
        return (
            <div className="market-empty">
                <p>No pudimos cargar las cotizaciones.</p>
                {onRefresh && (
                    <button
                        type="button"
                        className="market-icon-action mt-4"
                        title="Reintentar"
                        aria-label="Reintentar"
                        onClick={onRefresh}
                    >
                        <RotateCw size={17} />
                    </button>
                )}
            </div>
        );
    const topGainer = data.leaders.gainers[0];
    const topCommunity = data.community[0];
    return (
        <div className="market-section">
            <MarketHeader
                title="Resumen de mercado"
                eyebrow="COTIZACIONES · FINIX"
                icon={Activity}
                description={`Actualizado ${formatRelativeTime(data.updatedAt).toLowerCase()}`}
                actions={
                    onRefresh && (
                        <button
                            type="button"
                            className="market-icon-action"
                            onClick={onRefresh}
                            disabled={loading}
                            title="Actualizar cotizaciones"
                            aria-label="Actualizar cotizaciones"
                        >
                            <RotateCw
                                size={17}
                                className={loading ? 'animate-spin' : ''}
                            />
                        </button>
                    )
                }
            />
            <div className="market-stack">
                <MarketDashboardGrid>
                    <article className="market-card">
                        <h2 className="market-card__title">
                            <Activity size={17} />
                            Pulso del mercado
                        </h2>
                        <p className="market-card__value">{data.pulse.label}</p>
                        <p className="market-card__detail">
                            {data.pulse.summary}
                        </p>
                        <div className="market-quote-card__footer mt-5">
                            <span className="premarket-positive">
                                {data.pulse.advancing} en alza
                            </span>
                            <span className="premarket-negative">
                                {data.pulse.declining} en baja
                            </span>
                            <span>{data.pulse.unchanged} neutros</span>
                        </div>
                    </article>
                    <article className="market-card">
                        <h2 className="market-card__title">
                            <DollarSign size={17} />
                            Brecha cambiaria
                        </h2>
                        <p className="market-card__value">
                            {data.currencyGap
                                ? formatChange(data.currencyGap.gapPct)
                                : 'Sin datos'}
                        </p>
                        <p className="market-card__detail">
                            Dólar blue vs. oficial
                        </p>
                        {data.currencyGap && (
                            <p className="market-card__detail mt-3">
                                {formatCurrency(
                                    data.currencyGap.gapValue,
                                    'ARS',
                                )}{' '}
                                de diferencia
                            </p>
                        )}
                    </article>
                    {topGainer ? (
                        <AssetTile
                            item={topGainer}
                            quoteLabel="Mejor rendimiento"
                            onSelect={onSelectSymbol}
                        />
                    ) : (
                        <article className="market-card">
                            <h2 className="market-card__title">
                                <TrendingUp size={17} />
                                Mejor rendimiento
                            </h2>
                            <p className="market-card__detail mt-5">
                                Sin datos.
                            </p>
                        </article>
                    )}
                    {topCommunity ? (
                        <MarketQuoteCard
                            symbol={topCommunity.symbol}
                            label={topCommunity.label}
                            value={formatValue({
                                ...topCommunity,
                                format: 'currency',
                            })}
                            change={topCommunity.change}
                            quoteLabel="Radar Finix"
                            footer={`${formatCount(topCommunity.mentions)} menciones`}
                            footerRight={`${formatCount(topCommunity.engagement)} interacciones`}
                            onSelect={
                                onSelectSymbol
                                    ? () => onSelectSymbol(topCommunity.symbol)
                                    : undefined
                            }
                        />
                    ) : (
                        <article className="market-card">
                            <h2 className="market-card__title">
                                <Users size={17} />
                                Radar Finix
                            </h2>
                            <p className="market-card__detail mt-5">
                                Todavía no hay suficiente conversación para
                                armar el radar social.
                            </p>
                        </article>
                    )}
                </MarketDashboardGrid>
                {data.dollars.length > 0 && (
                    <section>
                        <MarketSectionTitle
                            title="Dólar hoy"
                            icon={DollarSign}
                            count={`${data.dollars.length} referencias`}
                        />
                        <MarketDashboardGrid>
                            {data.dollars.map((item) => (
                                <DollarTile key={item.id} item={item} />
                            ))}
                        </MarketDashboardGrid>
                    </section>
                )}
                {data.leaders.gainers.length > 0 && (
                    <section>
                        <MarketSectionTitle
                            title="Mayores subas"
                            icon={TrendingUp}
                        />
                        <MarketDashboardGrid>
                            {data.leaders.gainers.slice(0, 4).map((item) => (
                                <AssetTile
                                    key={item.id}
                                    item={item}
                                    onSelect={onSelectSymbol}
                                />
                            ))}
                        </MarketDashboardGrid>
                    </section>
                )}
                {data.leaders.losers.length > 0 && (
                    <section>
                        <MarketSectionTitle
                            title="Mayores bajas"
                            icon={TrendingDown}
                        />
                        <MarketDashboardGrid>
                            {data.leaders.losers.slice(0, 4).map((item) => (
                                <AssetTile
                                    key={item.id}
                                    item={item}
                                    onSelect={onSelectSymbol}
                                />
                            ))}
                        </MarketDashboardGrid>
                    </section>
                )}
                {(
                    Object.keys(
                        data.sections,
                    ) as (keyof MarketDashboardData['sections'])[]
                ).map((key) => (
                    <SectionCard
                        key={key}
                        sectionKey={key}
                        items={data.sections[key]}
                        onSelectSymbol={onSelectSymbol}
                    />
                ))}
            </div>
        </div>
    );
}
