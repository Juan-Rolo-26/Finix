import { useEffect, useState, useMemo } from 'react';
import {
    Clock,
    Search,
    SearchX,
    Sunrise,
    TrendingUp,
    Lock,
    Radio,
    Landmark,
    Activity,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    Minus,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    Coins,
    X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SymbolLogo } from '@/components/SymbolLogo';
import type { PremarketAsset, PremarketData } from './PreMarketSection';
import {
    resolvePremarketQuote,
    type DisplayPremarketAsset,
} from './premarket-quote';
import './premarket.css';

const CATEGORIES = [
    { key: 'all', label: 'Todos', title: 'Todos los activos', icon: Layers },
    {
        key: 'argentina',
        label: 'Argentina',
        title: 'Argentina en Wall Street',
        icon: Landmark,
    },
    {
        key: 'magnificent7',
        label: '7 Magníficas',
        title: 'Las 7 Magníficas',
        icon: Sparkles,
    },
    {
        key: 'indices',
        label: 'Índices',
        title: 'Índices globales',
        icon: Activity,
    },
    {
        key: 'commodities',
        label: 'Commodities',
        title: 'Materias primas',
        icon: TrendingUp,
    },
    { key: 'crypto', label: 'Cripto', title: 'Criptomonedas', icon: Coins },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];
type CategorizedAsset = DisplayPremarketAsset & {
    categoryKey: Exclude<CategoryKey, 'all'>;
};

const priceFormatters = {
    ARS: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
    }),
    USD: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }),
    number: new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }),
};
const changeFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
});
const timeFormatter = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Argentina/Buenos_Aires',
});
const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
});

function hasQuote(asset: PremarketAsset): boolean {
    return (
        !asset.unavailable &&
        asset.price != null &&
        Number.isFinite(asset.price)
    );
}

function formatPrice(a: PremarketAsset, price: number): string {
    if (a.format === 'percent') return `${price.toFixed(2)}%`;
    return priceFormatters[
        a.format === 'currency' ? a.currency || 'USD' : 'number'
    ].format(price);
}

function formatChange(change: number | null): string {
    if (change == null || !Number.isFinite(change)) return 'Sin datos';
    return `${changeFormatter.format(change)}%`;
}

function formatTime(value?: string): string {
    if (!value || Number.isNaN(new Date(value).getTime()))
        return 'Sin actualizar';
    return timeFormatter.format(new Date(value));
}

function AssetCard({
    asset,
    onSelect,
}: {
    asset: CategorizedAsset;
    onSelect?: (symbol: string) => void;
}) {
    const quoted = hasQuote(asset);
    const change =
        quoted && asset.change != null && Number.isFinite(asset.change)
            ? asset.change
            : null;
    const tone =
        change == null || change === 0
            ? 'neutral'
            : change > 0
              ? 'positive'
              : 'negative';
    const ChangeIcon =
        tone === 'positive'
            ? ArrowUpRight
            : tone === 'negative'
              ? ArrowDownRight
              : Minus;
    const ticker = asset.symbol.split(':').pop() || asset.symbol;
    const content = (
        <>
            <div className="market-quote-card__identity">
                <SymbolLogo symbol={asset.symbol} size={48} />
                <div className="market-quote-card__name">
                    <span className="market-quote-card__symbol">{ticker}</span>
                    <span
                        className="market-quote-card__label"
                        title={asset.label}
                    >
                        {asset.label}
                    </span>
                </div>
                {onSelect && (
                    <ArrowUpRight
                        className="market-quote-card__open"
                        size={18}
                        aria-hidden="true"
                    />
                )}
            </div>
            <div className="market-quote-card__quote">
                <span className="market-quote-card__quote-label">
                    {asset.isPremarketQuote || asset.requiresPremarket
                        ? 'Precio pre-market'
                        : 'Precio de referencia'}
                    {asset.format === 'currency' && (
                        <span>{asset.currency || 'USD'}</span>
                    )}
                </span>
                <div className="market-quote-card__numbers">
                    <span
                        className={`market-quote-card__price${quoted ? '' : ' market-quote-card__price--empty'}`}
                    >
                        {quoted
                            ? formatPrice(asset, asset.price!)
                            : 'Sin cotización'}
                    </span>
                    <span
                        className={`market-change market-change--${tone}`}
                    >
                        <ChangeIcon size={15} aria-hidden="true" />
                        {formatChange(change)}
                    </span>
                </div>
            </div>
            {(asset.isPremarketQuote || asset.requiresPremarket) &&
                asset.regularPrice != null && (
                    <div className="market-quote-card__regular">
                        <span>Precio regular</span>
                        <strong>
                            {formatPrice(asset, asset.regularPrice)}
                        </strong>
                        {asset.regularChange != null && (
                            <span>{formatChange(asset.regularChange)}</span>
                        )}
                    </div>
                )}
            <div className="market-quote-card__footer">
                <span>
                    <Clock size={13} aria-hidden="true" />{' '}
                    {formatTime(asset.updatedAt)} ART
                </span>
                <span>
                    {quoted
                        ? asset.isPremarketQuote
                            ? 'Pre-apertura'
                            : 'Referencia'
                        : asset.requiresPremarket
                          ? 'Sin pre-market'
                          : 'No disponible'}
                </span>
            </div>
        </>
    );

    return onSelect ? (
        <button
            type="button"
            className="market-quote-card"
            onClick={() => onSelect(asset.symbol)}
            aria-label={`Ver gráfico de ${asset.label} (${ticker})`}
        >
            {content}
        </button>
    ) : (
        <article className="market-quote-card">{content}</article>
    );
}

interface PremarketBriefProps {
    onSelectSymbol?: (symbol: string) => void;
}

export default function PremarketBrief({
    onSelectSymbol,
}: PremarketBriefProps) {
    const [data, setData] = useState<PremarketData | null>(null);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const res = await apiFetch('/market/premarket', {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Unavailable');
                const next = await res.json();
                if (!controller.signal.aborted) {
                    setData(next);
                    setError(false);
                }
            } catch {
                if (!controller.signal.aborted) setError(true);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        };
        void load();
        const timer = setInterval(load, 60000);
        return () => {
            controller.abort();
            clearInterval(timer);
        };
    }, [retry]);

    const allAssets = useMemo(() => {
        if (!data) return [];
        return CATEGORIES.flatMap((category): CategorizedAsset[] =>
            category.key === 'all'
                ? []
                : (data[category.key] || []).map((asset) => ({
                      ...resolvePremarketQuote(asset),
                      categoryKey: category.key,
                  })),
        );
    }, [data]);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        return CATEGORIES.filter(
            (category) =>
                category.key !== 'all' &&
                (activeCategory === 'all' || activeCategory === category.key),
        )
            .map((category) => ({
                ...category,
                assets: allAssets.filter(
                    (asset) =>
                        asset.categoryKey === category.key &&
                        (!q ||
                            `${asset.label} ${asset.symbol} ${asset.description}`
                                .toLowerCase()
                                .includes(q)),
                ),
            }))
            .filter((group) => group.assets.length > 0);
    }, [allAssets, activeCategory, query]);

    const stats = useMemo(() => {
        const quoted = allAssets.filter(hasQuote);
        return {
            withQuote: quoted.length,
            up: quoted.filter(
                (asset) => asset.change != null && asset.change > 0,
            ).length,
            down: quoted.filter(
                (asset) => asset.change != null && asset.change < 0,
            ).length,
        };
    }, [allAssets]);

    const isFrozen = Boolean(
        data &&
        (data.isFrozenPremarket || data.session.status !== 'pre-market'),
    );
    const sentiment = data?.session.sentiment || 'neutral';
    const sentimentScore = Math.min(
        100,
        Math.max(0, data?.session.sentimentScore ?? 50),
    );
    const sentimentLabel = {
        bullish: 'Alcista',
        bearish: 'Bajista',
        cautious: 'Cautela',
        neutral: 'Neutral',
    }[sentiment];
    const refresh = () => {
        setIsRefreshing(true);
        setRetry((value) => value + 1);
    };

    return (
        <section className="premarket" aria-label="Pre-Market">
            <header className="premarket-header">
                <div>
                    <div className="premarket-eyebrow">
                        <Sunrise size={17} aria-hidden="true" /> WALL STREET ·
                        PRE-APERTURA
                    </div>
                    <div className="premarket-title-row">
                        <h1>Pre-Market</h1>
                        <span
                            className={`premarket-status${!data ? '' : isFrozen ? ' premarket-status--frozen' : ' premarket-status--live'}`}
                        >
                            {!data ? (
                                <Clock size={13} />
                            ) : isFrozen ? (
                                <Lock size={13} />
                            ) : (
                                <Radio size={13} />
                            )}
                            {!data
                                ? isLoading
                                    ? 'Sincronizando'
                                    : 'Sin datos'
                                : isFrozen
                                  ? 'Corte guardado'
                                  : 'En vivo'}
                        </span>
                    </div>
                    <p className="premarket-header__date">
                        {data &&
                        !Number.isNaN(new Date(data.updatedAt).getTime())
                            ? dateFormatter.format(new Date(data.updatedAt))
                            : 'Cotizaciones de pre-apertura'}
                    </p>
                </div>
                <div className="premarket-header__timing">
                    <div className="premarket-cutoff">
                        <Clock size={18} aria-hidden="true" />
                        <div>
                            <span>Corte de referencia</span>
                            <strong>
                                10:30 <small>ART</small>
                            </strong>
                        </div>
                    </div>
                    <span className="premarket-header__updated">
                        {data
                            ? `${isFrozen ? 'Registro' : 'Actualizado'} ${formatTime(data.updatedAt)} ART`
                            : 'Esperando datos'}
                    </span>
                    <button
                        type="button"
                        className="premarket-icon-button"
                        onClick={refresh}
                        disabled={isLoading || isRefreshing}
                        title="Actualizar cotizaciones"
                        aria-label="Actualizar cotizaciones"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                isLoading || isRefreshing ? 'animate-spin' : ''
                            }
                        />
                    </button>
                </div>
            </header>

            <div className="premarket-overview">
                <div
                    className={`premarket-sentiment premarket-sentiment--${sentiment}`}
                >
                    <div className="premarket-sentiment__heading">
                        <span>
                            <Activity size={16} /> Clima de mercado
                        </span>
                        <strong>
                            {data ? sentimentLabel : 'Sin datos'}{' '}
                            <span>{data ? `${sentimentScore}%` : ''}</span>
                        </strong>
                    </div>
                    <meter
                        className="sr-only"
                        aria-label="Clima de mercado"
                        min={0}
                        max={100}
                        value={data ? sentimentScore : 0}
                        aria-valuetext={data ? sentimentLabel : 'Sin datos'}
                    />
                    <div
                        className="premarket-sentiment__track"
                        aria-hidden="true"
                    >
                        <span
                            style={{
                                width: data ? `${sentimentScore}%` : '0%',
                            }}
                        />
                    </div>
                    <p>
                        {data?.session.sentimentSummary ||
                            'Esperando el resumen de la sesión.'}
                    </p>
                </div>
                <dl className="premarket-stats">
                    <div>
                        <dt>
                            <ArrowUpRight size={16} /> En alza
                        </dt>
                        <dd className="premarket-positive">
                            {data ? stats.up : '—'}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            <ArrowDownRight size={16} /> En baja
                        </dt>
                        <dd className="premarket-negative">
                            {data ? stats.down : '—'}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            <Layers size={16} /> Cotizando
                        </dt>
                        <dd>
                            {data ? stats.withQuote : '—'}
                            <small> / {allAssets.length}</small>
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="premarket-controls">
                <div className="premarket-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Buscar activo o símbolo"
                        placeholder="Buscar activo o símbolo..."
                    />
                    {query && (
                        <button
                            type="button"
                            className="premarket-icon-button"
                            onClick={() => setQuery('')}
                            title="Limpiar búsqueda"
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div
                    className="premarket-filters"
                    role="group"
                    aria-label="Mercados"
                >
                    {CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const count =
                            category.key === 'all'
                                ? allAssets.length
                                : allAssets.filter(
                                      (asset) =>
                                          asset.categoryKey === category.key,
                                  ).length;
                        return (
                            <button
                                key={category.key}
                                type="button"
                                onClick={() => setActiveCategory(category.key)}
                                aria-pressed={activeCategory === category.key}
                                className="premarket-filter"
                            >
                                <Icon size={15} aria-hidden="true" />
                                {category.label}
                                <span>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="premarket-error" role="alert">
                    <ShieldAlert size={19} aria-hidden="true" />
                    <p>
                        {data
                            ? 'No se pudo actualizar. Se conservan las cotizaciones anteriores.'
                            : 'No se pudieron cargar las cotizaciones de pre-market.'}
                    </p>
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={15} /> Reintentar
                    </button>
                </div>
            )}

            {isLoading && !data && (
                <div
                    className="premarket-loading"
                    role="status"
                    aria-label="Cargando cotizaciones"
                >
                    {Array.from({ length: 6 }, (_, index) => (
                        <div
                            key={index}
                            className="premarket-skeleton animate-pulse"
                        >
                            <div />
                            <span />
                            <span />
                            <span />
                        </div>
                    ))}
                </div>
            )}

            <div className="premarket-groups">
                {groups.map((group) => {
                    const Icon = group.icon;
                    return (
                        <section
                            key={group.key}
                            className={`premarket-group premarket-group--${group.key}`}
                            aria-label={group.title}
                        >
                            <div className="premarket-group__heading">
                                <div>
                                    <span className="premarket-group__icon">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <h2>{group.title}</h2>
                                    <span className="premarket-group__count">
                                        {group.assets.length} {group.assets.length === 1 ? 'activo' : 'activos'}
                                    </span>
                                </div>
                                <span className="premarket-group__caption">
                                    {isFrozen ? 'Último corte' : 'Pre-apertura'}
                                    <ArrowRight size={14} aria-hidden="true" />
                                </span>
                            </div>
                            <div className="premarket-grid">
                                {group.assets.map((asset) => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onSelect={onSelectSymbol}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            {data && groups.length === 0 && (
                <div className="premarket-empty">
                    <SearchX size={30} aria-hidden="true" />
                    <h2>No hay activos para esta búsqueda</h2>
                    <p>
                        {query
                            ? `Sin resultados para “${query}”.`
                            : 'No hay cotizaciones disponibles en esta categoría.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setActiveCategory('all');
                        }}
                    >
                        Restablecer filtros
                    </button>
                </div>
            )}

            <footer className="premarket-note">
                <Lock size={14} aria-hidden="true" />
                <p>
                    El corte de pre-apertura se conserva al abrir la rueda
                    regular. Horarios en Argentina (ART).
                </p>
            </footer>
        </section>
    );
}
