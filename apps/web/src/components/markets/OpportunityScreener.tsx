import { useEffect, useMemo, useState } from 'react';
import {
    Building2,
    ChevronDown,
    HelpCircle,
    Filter,
    Gem,
    HeartPulse,
    Leaf,
    Loader2,
    RefreshCw,
    Search,
    Sparkles,
    TrendingUp,
    Bookmark,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { MarketChange, MarketHeader } from './MarketPrimitives';
import { Button } from '@/components/ui/button';
import { SymbolLogo } from '@/components/SymbolLogo';
import AddToWatchlistModal from '@/components/watchlist/AddToWatchlistModal';
import './opportunities.css';

type Category = 'ALL' | 'UNDERVALUED' | 'HEALTH' | 'GROWTH' | 'DIVIDEND';
type Opportunity = any;
type MetricTone = 'default' | 'positive' | 'negative' | 'accent';
type OpportunityMetric = {
    label: string;
    value: (item: Opportunity) => string;
    tone?: (item: Opportunity) => MetricTone;
};

const format = (value: number | null | undefined, signed = false) =>
    value === null || value === undefined
        ? '—'
        : `${signed && value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const money = (value: number | null | undefined) =>
    value === null || value === undefined
        ? '—'
        : `US$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const decimal = (value: number | null | undefined, digits = 1) =>
    value === null || value === undefined ? '—' : value.toFixed(digits);
const signedTone = (value: number | null | undefined): MetricTone =>
    value === null || value === undefined
        ? 'default'
        : value >= 0
          ? 'positive'
          : 'negative';
const scoreValue = (value: number | null | undefined) => decimal(value, 0);

const categoryMeta: Record<
    Category,
    { label: string; icon: typeof Gem; description: string }
> = {
    ALL: {
        label: 'Todas',
        icon: Sparkles,
        description: 'El universo completo ordenado por score Finix',
    },
    UNDERVALUED: {
        label: 'Infravaloradas',
        icon: Gem,
        description: 'Mayor diferencia entre valor estimado y precio',
    },
    HEALTH: {
        label: 'Salud financiera',
        icon: HeartPulse,
        description: 'Balance, liquidez y calidad operativa',
    },
    GROWTH: {
        label: 'Crecimiento',
        icon: TrendingUp,
        description: 'Crecimiento fundamental con cobertura disponible',
    },
    DIVIDEND: {
        label: 'Dividendos',
        icon: Leaf,
        description: 'Empresas con rendimiento de dividendo',
    },
};

const categoryMetrics: Record<Category, OpportunityMetric[]> = {
    ALL: [
        {
            label: 'Score Finix',
            value: (item) => scoreValue(item.opportunityScore),
            tone: () => 'accent',
        },
        {
            label: 'Potencial',
            value: (item) => format(item.upside, true),
            tone: (item) => signedTone(item.upside),
        },
        {
            label: 'ROIC',
            value: (item) => format(item.roic),
            tone: (item) => signedTone(item.roic),
        },
        {
            label: 'FCF yield',
            value: (item) => format(item.fcfYield),
            tone: (item) => signedTone(item.fcfYield),
        },
        {
            label: 'Dividendo',
            value: (item) => format(item.dividendYield),
            tone: (item) => signedTone(item.dividendYield),
        },
    ],
    UNDERVALUED: [
        {
            label: 'Potencial',
            value: (item) => format(item.upside, true),
            tone: (item) => signedTone(item.upside),
        },
        { label: 'Valor justo', value: (item) => money(item.fairValue) },
        { label: 'P/E', value: (item) => decimal(item.pe) },
        {
            label: 'FCF yield',
            value: (item) => format(item.fcfYield),
            tone: (item) => signedTone(item.fcfYield),
        },
        {
            label: 'Score Finix',
            value: (item) => scoreValue(item.opportunityScore),
            tone: () => 'accent',
        },
    ],
    HEALTH: [
        {
            label: 'Balance',
            value: (item) => scoreValue(item.scoreBreakdown?.balance),
            tone: () => 'accent',
        },
        {
            label: 'ROIC',
            value: (item) => format(item.roic),
            tone: (item) => signedTone(item.roic),
        },
        {
            label: 'ROE',
            value: (item) => format(item.roe),
            tone: (item) => signedTone(item.roe),
        },
        {
            label: 'Margen neto',
            value: (item) => format(item.netMargin),
            tone: (item) => signedTone(item.netMargin),
        },
        {
            label: 'Deuda/EBITDA',
            value: (item) => decimal(item.netDebtToEbitda),
        },
        {
            label: 'Piotroski',
            value: (item) => scoreValue(item.piotroskiScore),
        },
    ],
    GROWTH: [
        {
            label: 'Ingresos',
            value: (item) => format(item.revenueGrowth, true),
            tone: (item) => signedTone(item.revenueGrowth),
        },
        {
            label: 'EPS',
            value: (item) => format(item.epsGrowth, true),
            tone: (item) => signedTone(item.epsGrowth),
        },
        {
            label: 'EBITDA',
            value: (item) => format(item.ebitdaGrowth, true),
            tone: (item) => signedTone(item.ebitdaGrowth),
        },
        {
            label: 'FCF',
            value: (item) => format(item.fcfGrowth, true),
            tone: (item) => signedTone(item.fcfGrowth),
        },
        {
            label: 'Flujo de caja',
            value: (item) =>
                format(
                    item.operatingCashFlowGrowth ?? item.netIncomeGrowth,
                    true,
                ),
            tone: (item) =>
                signedTone(
                    item.operatingCashFlowGrowth ?? item.netIncomeGrowth,
                ),
        },
        {
            label: 'Score Finix',
            value: (item) => scoreValue(item.opportunityScore),
            tone: () => 'accent',
        },
    ],
    DIVIDEND: [
        {
            label: 'Yield',
            value: (item) => format(item.dividendYield),
            tone: (item) => signedTone(item.dividendYield),
        },
        {
            label: 'Payout',
            value: (item) => format(item.payoutRatio),
            tone: (item) => signedTone(item.payoutRatio),
        },
        {
            label: 'FCF yield',
            value: (item) => format(item.fcfYield),
            tone: (item) => signedTone(item.fcfYield),
        },
        {
            label: 'ROE',
            value: (item) => format(item.roe),
            tone: (item) => signedTone(item.roe),
        },
        {
            label: 'Potencial',
            value: (item) => format(item.upside, true),
            tone: (item) => signedTone(item.upside),
        },
        {
            label: 'Score Finix',
            value: (item) => scoreValue(item.opportunityScore),
            tone: () => 'accent',
        },
    ],
};

export default function OpportunityScreener({
    onOpenAnalysis,
}: {
    onOpenAnalysis: (ticker: string) => void;
}) {
    const [category, setCategory] = useState<Category>('ALL');
    const [search, setSearch] = useState('');
    const [sector, setSector] = useState('ALL');
    const [advanced, setAdvanced] = useState(false);
    const [filters, setFilters] = useState({
        minMarketCap: '',
        maxPe: '',
        minRoic: '',
        minUpside: '',
        minDividendYield: '',
        minRevenueGrowth: '',
        minFcfGrowth: '',
        maxNetDebtToEbitda: '',
        minPiotroski: '',
        minAltman: '',
    });
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [watchlistSymbol, setWatchlistSymbol] = useState<string | null>(null);
    const [watchlistName, setWatchlistName] = useState<string | undefined>(
        undefined,
    );

    const load = async (refresh = false) => {
        refresh ? setRefreshing(true) : setLoading(true);
        const params = new URLSearchParams({
            category,
            sector,
            query: search,
            sort:
                category === 'UNDERVALUED'
                    ? 'upside'
                    : category === 'DIVIDEND'
                      ? 'dividend'
                      : category === 'HEALTH'
                        ? 'health'
                        : category === 'GROWTH'
                          ? 'growth'
                          : 'score',
            limit: '150',
        });
        if (refresh) params.set('refresh', 'true');
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '') params.set(key, value);
        });
        if (!refresh) params.set('_t', String(Date.now()));
        try {
            const response = await apiFetch(
                `/market/opportunities?${params.toString()}`,
            );
            if (!response.ok) throw new Error();
            setData(await response.json());
        } catch {
            setData(
                (previous: any) =>
                    previous || {
                        items: [],
                        summary: {},
                        filters: { sectors: [] },
                    },
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => void load(), search ? 250 : 0);
        return () => window.clearTimeout(timer);
    }, [category, sector, search, filters]);

    const items: Opportunity[] = data?.items || [];
    const scoreLabel = useMemo(() => data?.methodology?.score || '', [data]);

    const filterLabels: Record<keyof typeof filters, string> = {
        minMarketCap: 'Capitalización mín. ($B)',
        maxPe: 'P/E máximo',
        minRoic: 'ROIC mínimo %',
        minUpside: 'Potencial alcista mínimo %',
        minDividendYield: 'Dividendo mín. %',
        minRevenueGrowth: 'Ingresos mín. %',
        minFcfGrowth: 'FCF mín. %',
        maxNetDebtToEbitda: 'Deuda neta / EBITDA máx.',
        minPiotroski: 'Piotroski mínimo',
        minAltman: 'Altman Z mínimo',
    };

    return (
        <section className="market-section">
            <MarketHeader
                title="Oportunidades"
                eyebrow="SCREENER CUANTITATIVO · FINIX"
                icon={Sparkles}
                description="S&P 500 · Valuación, calidad, crecimiento y dividendos"
                actions={
                    <button
                        type="button"
                        className="market-icon-action"
                        onClick={() => load(true)}
                        disabled={refreshing}
                        title="Actualizar oportunidades"
                        aria-label="Actualizar oportunidades"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? 'animate-spin' : ''}
                        />
                    </button>
                }
            />
            <div className="market-overview">
                <Stat
                    icon={Building2}
                    label="Universo S&P 500"
                    value={data?.summary?.totalCount ?? '—'}
                />
                <Stat
                    icon={Sparkles}
                    label="Con score Finix"
                    value={data?.summary?.scoredCount ?? '—'}
                />
                <Stat
                    icon={Gem}
                    label="Potencial estimado ≥20%"
                    value={data?.summary?.undervaluedCount ?? '—'}
                />
                <Stat
                    icon={Leaf}
                    label="Con dividendo"
                    value={data?.summary?.dividendCount ?? '—'}
                />
            </div>
            <div
                className="market-segments mb-5"
                role="group"
                aria-label="Tipo de oportunidad"
            >
                {(Object.keys(categoryMeta) as Category[]).map((key) => {
                    const meta = categoryMeta[key];
                    const Icon = meta.icon;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={category === key}
                            onClick={() => setCategory(key)}
                            title={meta.description}
                        >
                            <Icon size={15} />
                            {meta.label}
                        </button>
                    );
                })}
            </div>
            <div className="market-toolbar">
                <label className="market-search">
                    <Search size={18} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Buscar empresa en oportunidades"
                        placeholder="Buscar ticker o empresa..."
                    />
                </label>
                <select
                    className="market-control"
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                    aria-label="Sector de oportunidades"
                >
                    <option value="ALL">Todos los sectores</option>
                    {(data?.filters?.sectors || []).map((value: string) => (
                        <option key={value}>{value}</option>
                    ))}
                </select>
                <Button
                    variant="outline"
                    onClick={() => setAdvanced((value) => !value)}
                    aria-expanded={advanced}
                    className="market-action"
                >
                    <Filter size={16} />
                    Filtros avanzados
                    <ChevronDown
                        size={14}
                        className={advanced ? 'rotate-180' : ''}
                    />
                </Button>
                {advanced && (
                    <div className="market-advanced">
                        {(Object.keys(filters) as (keyof typeof filters)[]).map(
                            (key) => (
                                <Field
                                    key={key}
                                    label={filterLabels[key]}
                                    value={filters[key]}
                                    displayBillions={key === 'minMarketCap'}
                                    onChange={(value: string) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            [key]:
                                                key === 'minMarketCap' && value
                                                    ? String(
                                                          Number(value) * 1e9,
                                                      )
                                                    : value,
                                        }))
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
            {loading ? (
                <div className="market-empty" role="status">
                    <Loader2
                        size={24}
                        className="animate-spin mx-auto text-primary"
                    />
                </div>
            ) : (
                <>
                    {data?.stale && (
                        <p className="market-note">
                            Mostrando la última lectura válida mientras se
                            recupera la fuente de mercado.
                        </p>
                    )}
                    <p className="market-results">
                        {data?.summary?.matchingCount ?? 0} empresas ·{' '}
                        {scoreLabel}
                    </p>
                    {items.length > 0 && (
                        <OpportunityTable
                            items={items}
                            category={category}
                            onOpen={onOpenAnalysis}
                            onAddToWatchlist={(ticker, name) => {
                                setWatchlistSymbol(ticker);
                                setWatchlistName(name);
                            }}
                        />
                    )}
                    {!items.length && (
                        <div className="market-empty">
                            No hay empresas con los criterios seleccionados.
                            Probá flexibilizar un filtro.
                        </div>
                    )}
                </>
            )}
            <footer className="market-note">
                <HelpCircle size={16} />
                <p>
                    <b className="text-foreground">Transparencia del score.</b>{' '}
                    Valuación 30%, calidad financiera 25%, crecimiento 20%,
                    rentabilidad 15% y balance 10%. La cobertura indica qué
                    parte del score pudo calcularse. Las métricas faltantes no
                    se inventan. El score no es una recomendación de compra o
                    venta.
                </p>
            </footer>
            {watchlistSymbol && (
                <AddToWatchlistModal
                    isOpen={Boolean(watchlistSymbol)}
                    onClose={() => setWatchlistSymbol(null)}
                    symbol={watchlistSymbol}
                    name={watchlistName}
                />
            )}
        </section>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Building2;
    label: string;
    value: string | number;
}) {
    return (
        <div className="market-stat">
            <div className="market-stat__label">
                <Icon size={15} />
                {label}
            </div>
            <p className="market-stat__value">{value}</p>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    displayBillions,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    displayBillions?: boolean;
}) {
    return (
        <label>
            <span className="market-metric-label block mb-1">{label}</span>
            <input
                className="market-control w-full"
                type="number"
                value={displayBillions && value ? Number(value) / 1e9 : value}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}

function OpportunityTable({
    items,
    category,
    onOpen,
    onAddToWatchlist,
}: {
    items: Opportunity[];
    category: Category;
    onOpen: (ticker: string) => void;
    onAddToWatchlist: (ticker: string, name?: string) => void;
}) {
    return (
        <div
            className="opportunities-table-scroll"
            role="region"
            aria-label={`Empresas: ${categoryMeta[category].label}`}
            tabIndex={0}
        >
            <table className="opportunities-table" aria-label={`Oportunidades: ${categoryMeta[category].label}`}>
                <thead>
                    <tr>
                        <th scope="col">Empresa</th>
                        <th scope="col">Precio / variación</th>
                        {categoryMetrics[category].map((metric) => (
                            <th scope="col" key={metric.label}>{metric.label}</th>
                        ))}
                        <th scope="col">Cobertura</th>
                        <th scope="col"><span className="sr-only">Seguimiento</span></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <OpportunityRow
                            key={item.ticker}
                            item={item}
                            category={category}
                            onOpen={onOpen}
                            onAddToWatchlist={onAddToWatchlist}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OpportunityRow({
    item,
    category,
    onOpen,
    onAddToWatchlist,
}: {
    item: Opportunity;
    category: Category;
    onOpen: (ticker: string) => void;
    onAddToWatchlist: (ticker: string, name?: string) => void;
}) {
    return (
        <tr onClick={() => onOpen(item.ticker)}>
            <th scope="row">
                <button
                    type="button"
                    className="opportunities-company"
                    aria-label={`Ver análisis de ${item.name} (${item.ticker})`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen(item.ticker);
                    }}
                >
                    <SymbolLogo symbol={item.symbol} size={36} />
                    <span className="opportunities-company__name">
                        <strong>{item.ticker}</strong>
                        <span title={item.name}>{item.name}</span>
                        <small>{item.sector || 'Sin sector'}</small>
                    </span>
                </button>
            </th>
            <td className="opportunities-price">
                <strong>{money(item.price)}</strong>
                <MarketChange value={item.change} />
            </td>
            {categoryMetrics[category].map((metric) => (
                <td key={metric.label} className={metricToneClass(metric.tone?.(item) || 'default')}>
                    {metric.value(item)}
                </td>
            ))}
            <td className="opportunities-coverage">{item.scoreCoverage ?? 0}%</td>
            <td>
                <button
                    type="button"
                    className="market-icon-action"
                    title="Agregar a Seguimiento"
                    aria-label={`Agregar ${item.ticker} a Seguimiento`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onAddToWatchlist(item.ticker, item.name);
                    }}
                >
                    <Bookmark size={16} />
                </button>
            </td>
        </tr>
    );
}

function metricToneClass(tone: MetricTone) {
    return tone === 'positive'
        ? 'text-emerald-500'
        : tone === 'negative'
          ? 'text-rose-500'
          : tone === 'accent'
            ? 'text-violet-700 dark:text-violet-300'
            : 'text-foreground';
}
