import { useEffect, useMemo, useState } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    Grid3X3,
    HelpCircle,
    LayoutGrid,
    Loader2,
    Minus,
    RefreshCw,
    Search,
} from 'lucide-react';
import { SymbolLogo } from '@/components/SymbolLogo';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MarketHeader } from './MarketPrimitives';
import './value-creation.css';

type ValueStatus =
    'CREA_VALOR' | 'DESTRUYE_VALOR' | 'EN_EQUILIBRIO' | 'SIN_COBERTURA';
type FilterStatus = 'ALL' | ValueStatus;

interface ValueItem {
    symbol: string;
    ticker: string;
    name: string;
    sector: string;
    marketCap: number | null;
    roic: number | null;
    wacc: number | null;
    spread: number | null;
    beta: number | null;
    costOfEquity: number | null;
    costOfDebt: number | null;
    status: ValueStatus;
    alphaSpreadUrl: string;
}

interface ValuePayload {
    summary: {
        totalCount: number;
        coveredCount: number;
        createsValueCount: number;
        destroysValueCount: number;
        equilibriumCount: number;
        medianSpread: number | null;
        updatedAt: string;
        stale: boolean;
    };
    methodology: {
        riskFreeRate: number;
        equityRiskPremium: number;
        taxRateFallback: number;
        description: string;
    };
    items: ValueItem[];
}

const rateFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const spreadFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
});
const formatRate = (value: number | null | undefined, signed = false) =>
    value == null || !Number.isFinite(value)
        ? null
        : (signed ? spreadFormatter : rateFormatter).format(value);
const percent = (value: number | null | undefined) => {
    const formatted = formatRate(value);
    return formatted === null ? '—' : `${formatted}%`;
};
const spreadPoints = (value: number | null | undefined) => {
    const formatted = formatRate(value, true);
    return formatted === null ? 'Sin datos' : `${formatted} pp`;
};

const marketCap = (value: number | null) => {
    if (!value) return '—';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
    return `$${(value / 1e6).toFixed(0)}M`;
};

const statusStyle: Record<ValueStatus, { label: string }> = {
    CREA_VALOR: { label: 'Crea valor' },
    DESTRUYE_VALOR: { label: 'Destruye valor' },
    EN_EQUILIBRIO: { label: 'En equilibrio' },
    SIN_COBERTURA: { label: 'Sin cobertura' },
};

export default function ValueCreationHeatmap({
    onSelectSymbol,
}: {
    onSelectSymbol?: (symbol: string) => void;
}) {
    const [data, setData] = useState<ValuePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [sector, setSector] = useState('ALL');
    const [viewDisplay, setViewDisplay] = useState<'tiles' | 'cards'>('cards');

    const load = async (force = false) => {
        force ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const query = force
                ? 'refresh=true'
                : `refresh=true&_t=${Date.now()}`;
            const res = await apiFetch(`/market/value-creation/sp500?${query}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const payload = await res.json();
            if (!Array.isArray(payload?.items))
                throw new Error('Respuesta inválida');
            setData(payload);
        } catch (err: any) {
            setError(
                'No pudimos actualizar el mapa de creación de valor. Reintentá en unos segundos.',
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const sectors = useMemo(
        () =>
            Array.from(
                new Set(
                    (data?.items || [])
                        .map((item) => item.sector)
                        .filter(Boolean),
                ),
            ).sort(),
        [data],
    );
    const items = useMemo(
        () =>
            (data?.items || [])
                .filter((item) => filter === 'ALL' || item.status === filter)
                .filter((item) => sector === 'ALL' || item.sector === sector)
                .filter((item) => {
                    const clean = query.trim().toLowerCase();
                    return (
                        !clean ||
                        item.ticker.toLowerCase().includes(clean) ||
                        item.name.toLowerCase().includes(clean)
                    );
                })
                .sort(
                    (a, b) => (b.spread ?? -Infinity) - (a.spread ?? -Infinity),
                ),
        [data, filter, sector, query],
    );

    if (loading) {
        return (
            <div className="flex min-h-[440px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
            </div>
        );
    }

    const summary = data?.summary;

    return (
        <div className="market-section value-creation">
            <MarketHeader
                title="Creación de valor"
                eyebrow="INTELIGENCIA FUNDAMENTAL · FINIX"
                icon={Building2}
                description="S&P 500 · ROIC, WACC y retorno sobre el capital"
                actions={
                    <button
                        type="button"
                        className="market-icon-action"
                        onClick={() => load(true)}
                        disabled={refreshing}
                        title="Actualizar datos"
                        aria-label="Actualizar datos"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? 'animate-spin' : ''}
                        />
                    </button>
                }
            />
            <div className="market-overview">
                <Metric
                    title="Cobertura S&P 500"
                    value={`${summary?.coveredCount ?? 0}/${summary?.totalCount ?? 0}`}
                    sub="Empresas con ROIC y WACC"
                    tone="neutral"
                />
                <Metric
                    title="Creadoras de valor"
                    value={String(summary?.createsValueCount ?? 0)}
                    sub="Spread mayor a +2 pp"
                    tone="positive"
                />
                <Metric
                    title="Destructoras de valor"
                    value={String(summary?.destroysValueCount ?? 0)}
                    sub="Spread menor a -2 pp"
                    tone="negative"
                />
                <Metric
                    title="Spread mediano"
                    value={spreadPoints(summary?.medianSpread)}
                    sub="ROIC menos WACC"
                    tone={
                        (summary?.medianSpread ?? 0) >= 0
                            ? 'positive'
                            : 'negative'
                    }
                />
            </div>
            <div className="market-toolbar value-toolbar">
                <div className="market-search">
                    <Search size={18} />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Buscar empresa en creación de valor"
                        placeholder="Buscar ticker o empresa..."
                    />
                </div>
                <div
                    className="market-segments value-filters"
                    role="group"
                    aria-label="Creación de valor"
                >
                    {(
                        [
                            'ALL',
                            'CREA_VALOR',
                            'DESTRUYE_VALOR',
                            'EN_EQUILIBRIO',
                            'SIN_COBERTURA',
                        ] as FilterStatus[]
                    ).map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilter(status)}
                            aria-pressed={filter === status}
                        >
                            {status === 'ALL'
                                ? 'Todas'
                                : statusStyle[status].label}
                        </button>
                    ))}
                </div>
                <select
                    className="market-control"
                    aria-label="Sector de creación de valor"
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                >
                    <option value="ALL">Todos los sectores</option>
                    {sectors.map((value) => (
                        <option key={value}>{value}</option>
                    ))}
                </select>
                <div
                    className="market-segments value-view-switch"
                    role="group"
                    aria-label="Modo de visualización"
                >
                    <button
                        type="button"
                        aria-label="Vista de mosaico"
                        className="market-segment-icon"
                        title="Vista de mosaico (recuadros)"
                        aria-pressed={viewDisplay === 'tiles'}
                        onClick={() => setViewDisplay('tiles')}
                    >
                        <Grid3X3 size={17} />
                    </button>
                    <button
                        type="button"
                        aria-label="Vista de tarjetas"
                        className="market-segment-icon"
                        title="Vista de tarjetas"
                        aria-pressed={viewDisplay === 'cards'}
                        onClick={() => setViewDisplay('cards')}
                    >
                        <LayoutGrid size={17} />
                    </button>
                </div>
            </div>
            {error && (
                <div className="premarket-error" role="alert">
                    {error}
                </div>
            )}
            {summary?.stale && (
                <div className="market-note">
                    Mostrando la última lectura válida mientras se restablece la
                    actualización de mercado.
                </div>
            )}
            <div className="value-results" aria-live="polite">
                <p><strong>{items.length}</strong> empresas</p>
                {summary?.updatedAt && (
                    <span>Actualizado {new Date(summary.updatedAt).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}</span>
                )}
            </div>
            <div className={cn('value-grid', viewDisplay === 'tiles' && 'value-grid--compact')}>
                {items.map((item) => (
                    <ValueTile
                        key={item.ticker}
                        item={item}
                        compact={viewDisplay === 'tiles'}
                        onSelect={onSelectSymbol}
                    />
                ))}
            </div>
            {!items.length && (
                <div className="market-empty">
                    No hay empresas que coincidan con los filtros.
                </div>
            )}
            <footer className="market-note">
                <HelpCircle size={16} />
                <div>
                    <b className="text-foreground">Metodología y límites</b>
                    <p>
                        {data?.methodology.description} WACC se recalcula con la
                        estructura financiera y las condiciones de mercado.
                        Bancos, aseguradoras y REITs requieren lectura sectorial
                        adicional.
                    </p>
                    <p>
                        Actualizado:{' '}
                        {summary
                            ? new Date(summary.updatedAt).toLocaleString(
                                  'es-AR',
                              )
                            : '—'}{' '}
                        · Tasa libre de riesgo {data?.methodology.riskFreeRate}%
                        · ERP {data?.methodology.equityRiskPremium}%.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function Metric({
    title,
    value,
    sub,
    tone,
}: {
    title: string;
    value: string;
    sub: string;
    tone: 'positive' | 'negative' | 'neutral';
}) {
    return (
        <div className="market-stat">
            <p className="market-stat__label">{title}</p>
            <p
                className={cn(
                    'market-stat__value',
                    tone === 'positive'
                        ? 'premarket-positive'
                        : tone === 'negative'
                          ? 'premarket-negative'
                          : '',
                )}
            >
                {value}
            </p>
            <p className="market-stat__detail">{sub}</p>
        </div>
    );
}

function ValueTile({
    item,
    compact,
    onSelect,
}: {
    item: ValueItem;
    compact: boolean;
    onSelect?: (symbol: string) => void;
}) {
    const StatusIcon = item.status === 'CREA_VALOR'
        ? ArrowUpRight : item.status === 'DESTRUYE_VALOR' ? ArrowDownRight : Minus;
    return (
        <article className={cn('value-company', `value-company--${item.status.toLowerCase()}`)}>
            {onSelect && (
                <button
                    type="button"
                    className="value-company__link"
                    onClick={() => onSelect(item.symbol)}
                    aria-label={`Ver ${item.name} (${item.ticker})`}
                    title={`Ver gráfico de ${item.ticker}`}
                />
            )}
            <div className="value-company__identity">
                <SymbolLogo symbol={item.symbol} size={compact ? 40 : 48} />
                <div className="value-company__name">
                    <h2>{item.ticker}</h2>
                    <p>{item.name}</p>
                </div>
                {onSelect && <ArrowUpRight className="value-company__open" size={19} aria-hidden="true" />}
            </div>
            <div className="value-company__spread">
                <span>Spread <span className="value-company__formula">ROIC − WACC</span></span>
                <strong>{spreadPoints(item.spread)}</strong>
                <span className="value-company__status">
                    <StatusIcon size={16} aria-hidden="true" />
                    {statusStyle[item.status].label}
                </span>
            </div>
            <dl className="value-company__comparison">
                <div>
                    <dt>ROIC <span>Retorno del capital</span></dt>
                    <dd>{percent(item.roic)}</dd>
                </div>
                <div>
                    <dt>WACC <span>Costo del capital</span></dt>
                    <dd>{percent(item.wacc)}</dd>
                </div>
            </dl>
            {!compact && <dl className="value-company__details">
                <div>
                    <dt>Capitalización</dt>
                    <dd>{marketCap(item.marketCap)}</dd>
                </div>
                <div>
                    <dt>Beta</dt>
                    <dd>{item.beta?.toFixed(2) ?? '—'}</dd>
                </div>
            </dl>}
            <footer className="value-company__sector">{item.sector || 'Sector no disponible'}</footer>
        </article>
    );
}
