import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Building2, HelpCircle, Filter, Loader2, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SymbolLogo } from '@/components/SymbolLogo';

type ValueStatus = 'CREA_VALOR' | 'DESTRUYE_VALOR' | 'EN_EQUILIBRIO' | 'SIN_COBERTURA';
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
    methodology: { riskFreeRate: number; equityRiskPremium: number; taxRateFallback: number; description: string };
    items: ValueItem[];
}

const percent = (value: number | null, signed = false) => value === null || value === undefined
    ? '—'
    : `${signed && value > 0 ? '+' : ''}${value.toFixed(1)}%`;

const marketCap = (value: number | null) => {
    if (!value) return '—';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
    return `$${(value / 1e6).toFixed(0)}M`;
};

const statusStyle: Record<ValueStatus, { label: string; card: string; badge: string }> = {
    CREA_VALOR: {
        label: 'Crea valor',
        card: 'border-emerald-500/55 bg-gradient-to-br from-emerald-500/30 via-emerald-500/12 to-card hover:border-emerald-500 hover:shadow-emerald-500/15',
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    },
    DESTRUYE_VALOR: {
        label: 'Destruye valor',
        card: 'border-rose-500/55 bg-gradient-to-br from-rose-500/30 via-rose-500/12 to-card hover:border-rose-500 hover:shadow-rose-500/15',
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-200',
    },
    EN_EQUILIBRIO: {
        label: 'En equilibrio',
        card: 'border-border/70 bg-card hover:border-slate-400/70',
        badge: 'bg-muted text-muted-foreground',
    },
    SIN_COBERTURA: {
        label: 'Sin cobertura',
        card: 'border-border/50 bg-card/60 opacity-75',
        badge: 'bg-muted text-muted-foreground',
    },
};

export default function ValueCreationHeatmap({ onSelectSymbol }: { onSelectSymbol?: (symbol: string) => void }) {
    const [data, setData] = useState<ValuePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [sector, setSector] = useState('ALL');

    const load = async (force = false) => {
        force ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const query = force ? 'refresh=true' : `refresh=true&_t=${Date.now()}`;
            const res = await apiFetch(`/market/value-creation/sp500?${query}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const payload = await res.json();
            if (!Array.isArray(payload?.items)) throw new Error('Respuesta inválida');
            setData(payload);
        } catch (err: any) {
            setError('No pudimos actualizar el mapa de creación de valor. Reintentá en unos segundos.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const sectors = useMemo(() => Array.from(new Set((data?.items || []).map((item) => item.sector).filter(Boolean))).sort(), [data]);
    const items = useMemo(() => (data?.items || [])
        .filter((item) => filter === 'ALL' || item.status === filter)
        .filter((item) => sector === 'ALL' || item.sector === sector)
        .filter((item) => {
            const clean = query.trim().toLowerCase();
            return !clean || item.ticker.toLowerCase().includes(clean) || item.name.toLowerCase().includes(clean);
        })
        .sort((a, b) => (b.spread ?? -Infinity) - (a.spread ?? -Infinity)), [data, filter, sector, query]);

    if (loading) {
        return <div className="flex min-h-[440px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-500" /></div>;
    }

    const summary = data?.summary;
    return (
        <div className="space-y-5">
            <Card className="overflow-hidden rounded-[28px] border-emerald-500/25 bg-gradient-to-br from-emerald-500/12 via-card to-card p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Building2 className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.18em]">Inteligencia fundamental</span></div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Radar de Creación de Valor</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Compara el retorno sobre el capital invertido con su coste de capital. Cuando <b className="text-foreground">ROIC supera WACC</b>, la empresa crea riqueza económica; cuando queda por debajo, destruye valor aunque sus ventas crezcan.</p>
                    </div>
                    <Button variant="outline" onClick={() => load(true)} disabled={refreshing} className="h-10 shrink-0 gap-2 rounded-xl border-emerald-500/30 bg-card/70 hover:bg-emerald-500/10">
                        <RefreshCw className={cn('h-4 w-4 text-emerald-500', refreshing && 'animate-spin')} /> Actualizar datos
                    </Button>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric title="Cobertura S&P 500" value={`${summary?.coveredCount ?? 0}/${summary?.totalCount ?? 0}`} sub="Empresas con ROIC y WACC" tone="neutral" />
                    <Metric title="Creadoras de valor" value={String(summary?.createsValueCount ?? 0)} sub="Spread mayor a +2 pp" tone="positive" />
                    <Metric title="Destructoras de valor" value={String(summary?.destroysValueCount ?? 0)} sub="Spread menor a -2 pp" tone="negative" />
                    <Metric title="Spread mediano" value={percent(summary?.medianSpread ?? null, true)} sub="ROIC menos WACC" tone={(summary?.medianSpread ?? 0) >= 0 ? 'positive' : 'negative'} />
                </div>
            </Card>

            <Card className="rounded-[24px] border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl md:p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ticker o empresa…" className="h-10 w-full rounded-xl border border-border/60 bg-background/70 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" /></div>
                    <div className="flex flex-wrap gap-1.5">
                        {(['ALL', 'CREA_VALOR', 'DESTRUYE_VALOR', 'EN_EQUILIBRIO'] as FilterStatus[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn('rounded-lg px-3 py-2 text-xs font-bold transition-colors', filter === item ? 'bg-foreground text-background' : 'bg-muted/70 text-muted-foreground hover:bg-muted')}>
                            {item === 'ALL' ? 'Todas' : statusStyle[item].label}
                        </button>)}
                    </div>
                    <div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><select value={sector} onChange={(event) => setSector(event.target.value)} className="h-10 max-w-[210px] appearance-none rounded-xl border border-border/60 bg-background py-0 pl-8 pr-8 text-xs font-bold outline-none focus:border-emerald-500"><option value="ALL">Todos los sectores</option>{sectors.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                </div>
            </Card>

            {error && <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm font-medium text-rose-700 dark:text-rose-300">{error}</div>}
            {summary?.stale && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">Mostrando la última lectura válida mientras se restablece la actualización de mercado.</div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {items.map((item) => <ValueTile key={item.ticker} item={item} onSelect={onSelectSymbol} />)}
            </div>
            {!items.length && <div className="py-16 text-center text-sm text-muted-foreground">No hay empresas que coincidan con los filtros.</div>}

            <Card className="rounded-[24px] border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
                <div className="flex gap-3"><HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /><div><p className="font-bold text-foreground">Metodología y límites</p><p className="mt-1 leading-relaxed">{data?.methodology.description} WACC no es un dato universal: se recalcula con la estructura financiera y las condiciones de mercado. Bancos, aseguradoras y REITs requieren lectura sectorial adicional. Alpha Spread se abre como referencia externa por acción; Finix no copia ni extrae datos de sitios de terceros.</p><p className="mt-2 text-xs">Actualizado: {summary ? new Date(summary.updatedAt).toLocaleString('es-AR') : '—'} · Tasa libre de riesgo {data?.methodology.riskFreeRate}% · ERP {data?.methodology.equityRiskPremium}%.</p></div></div>
            </Card>
        </div>
    );
}

function Metric({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: 'positive' | 'negative' | 'neutral' }) {
    const colors = tone === 'positive' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : tone === 'negative' ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'border-border/60 bg-background/60 text-foreground';
    return <div className={cn('rounded-2xl border p-3.5', colors)}><p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{title}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p><p className="mt-0.5 text-[11px] font-medium opacity-75">{sub}</p></div>;
}

function ValueTile({ item, onSelect }: { item: ValueItem; onSelect?: (symbol: string) => void }) {
    const style = statusStyle[item.status];
    const positive = (item.spread ?? 0) > 0;
    return <button onClick={() => onSelect?.(item.symbol)} className={cn('group min-h-[176px] rounded-2xl border p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', style.card)}>
        <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><SymbolLogo symbol={item.symbol} size={28} /><div className="min-w-0"><p className="font-black tracking-tight text-foreground">{item.ticker}</p><p className="truncate text-[10px] text-muted-foreground">{item.name}</p></div></div><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" /></div>
        <div className="mt-4 grid grid-cols-2 gap-2"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">ROIC</p><p className="text-lg font-black text-foreground">{percent(item.roic)}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">WACC</p><p className="text-lg font-black text-foreground">{percent(item.wacc)}</p></div></div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-2.5 dark:border-white/10"><span className={cn('rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide', style.badge)}>{style.label}</span><span className={cn('flex items-center gap-1 font-mono text-sm font-black', positive ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'DESTRUYE_VALOR' ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>{positive ? <TrendingUp className="h-3.5 w-3.5" /> : item.status === 'DESTRUYE_VALOR' ? <TrendingDown className="h-3.5 w-3.5" /> : null}{percent(item.spread, true)}</span></div>
        <p className="mt-2 truncate text-[10px] text-muted-foreground">{item.sector} · Cap. {marketCap(item.marketCap)}</p>
    </button>;
}
