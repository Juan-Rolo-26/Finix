import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, HelpCircle, Filter, Gem, HeartPulse, Leaf, Loader2, RefreshCw, Search, Sparkles, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SymbolLogo } from '@/components/SymbolLogo';

type Category = 'ALL' | 'UNDERVALUED' | 'HEALTH' | 'GROWTH' | 'DIVIDEND';
type Opportunity = any;

const format = (value: number | null | undefined, signed = false) => value === null || value === undefined ? '—' : `${signed && value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const money = (value: number | null | undefined) => value === null || value === undefined ? '—' : `$${value.toFixed(2)}`;

const categoryMeta: Record<Category, { label: string; icon: typeof Gem; description: string }> = {
    ALL: { label: 'Todas', icon: Sparkles, description: 'El universo completo ordenado por score Finix' },
    UNDERVALUED: { label: 'Infravaloradas', icon: Gem, description: 'Mayor diferencia entre valor estimado y precio' },
    HEALTH: { label: 'Salud financiera', icon: HeartPulse, description: 'Balance, liquidez y calidad operativa' },
    GROWTH: { label: 'Crecimiento', icon: TrendingUp, description: 'Crecimiento fundamental con cobertura disponible' },
    DIVIDEND: { label: 'Dividendos', icon: Leaf, description: 'Empresas con rendimiento de dividendo' },
};

export default function OpportunityScreener({ onOpenAnalysis }: { onOpenAnalysis: (ticker: string) => void }) {
    const [category, setCategory] = useState<Category>('ALL');
    const [search, setSearch] = useState('');
    const [sector, setSector] = useState('ALL');
    const [advanced, setAdvanced] = useState(false);
    const [filters, setFilters] = useState({ minMarketCap: '', maxPe: '', minRoic: '', minUpside: '', minDividendYield: '', minRevenueGrowth: '', minFcfGrowth: '', maxNetDebtToEbitda: '', minPiotroski: '', minAltman: '' });
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (refresh = false) => {
        refresh ? setRefreshing(true) : setLoading(true);
        const params = new URLSearchParams({ category, sector, query: search, sort: category === 'UNDERVALUED' ? 'upside' : category === 'DIVIDEND' ? 'dividend' : category === 'HEALTH' ? 'health' : 'score', limit: '150' });
        if (refresh) params.set('refresh', 'true');
        Object.entries(filters).forEach(([key, value]) => { if (value !== '') params.set(key, value); });
        if (!refresh) params.set('_t', String(Date.now()));
        try {
            const response = await apiFetch(`/market/opportunities?${params.toString()}`);
            if (!response.ok) throw new Error();
            setData(await response.json());
        } catch {
            setData((previous: any) => previous || { items: [], summary: {}, filters: { sectors: [] } });
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => void load(), search ? 250 : 0);
        return () => window.clearTimeout(timer);
    }, [category, sector, search, filters]);

    const items: Opportunity[] = data?.items || [];
    const scoreLabel = useMemo(() => data?.methodology?.score || '', [data]);

    return <div className="space-y-5">
        <Card className="overflow-hidden rounded-[30px] border-violet-500/25 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.17),transparent_48%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--card)))] p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl"><div className="mb-2 flex items-center gap-2 text-violet-600 dark:text-violet-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.18em]">Screener cuantitativo Finix</span></div><h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Oportunidades</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Descubrí empresas por valuación, calidad, crecimiento, flujo de caja, dividendos y balance. El <b className="text-foreground">Finix Opportunity Score</b> ordena datos disponibles; no es una recomendación de compra o venta.</p></div>
                <Button variant="outline" onClick={() => load(true)} disabled={refreshing} className="h-10 gap-2 rounded-xl border-violet-500/30 bg-card/70 hover:bg-violet-500/10"><RefreshCw className={cn('h-4 w-4 text-violet-500', refreshing && 'animate-spin')} />Actualizar</Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Building2} label="Universo S&P 500" value={data?.summary?.totalCount ?? '—'} tone="neutral" /><Stat icon={Sparkles} label="Con puntuación de oportunidad" value={data?.summary?.scoredCount ?? '—'} tone="violet" /><Stat icon={Gem} label="Potencial alcista estimado ≥20%" value={data?.summary?.undervaluedCount ?? '—'} tone="emerald" /><Stat icon={Leaf} label="Con dividendo" value={data?.summary?.dividendCount ?? '—'} tone="amber" /></div>
        </Card>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{(Object.keys(categoryMeta) as Category[]).map((key) => { const meta = categoryMeta[key]; const Icon = meta.icon; return <button key={key} onClick={() => setCategory(key)} className={cn('rounded-2xl border p-3 text-left transition-all', category === key ? 'border-violet-500 bg-violet-500/13 shadow-sm' : 'border-border/60 bg-card/60 hover:border-violet-500/40')}><div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', category === key ? 'text-violet-500' : 'text-muted-foreground')} /><span className="text-sm font-black text-foreground">{meta.label}</span></div><p className="mt-1 text-[10px] leading-snug text-muted-foreground">{meta.description}</p></button>; })}</div>

        <Card className="rounded-[24px] border-border/60 bg-card/70 p-3 shadow-sm"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ticker o empresa…" className="h-10 w-full rounded-xl border border-border/60 bg-background/70 pl-9 pr-3 text-sm outline-none focus:border-violet-500" /></div><select value={sector} onChange={(event) => setSector(event.target.value)} className="h-10 rounded-xl border border-border/60 bg-background px-3 text-xs font-bold outline-none focus:border-violet-500"><option value="ALL">Todos los sectores</option>{(data?.filters?.sectors || []).map((item: string) => <option key={item}>{item}</option>)}</select><Button variant="outline" onClick={() => setAdvanced((value) => !value)} className="h-10 gap-2 rounded-xl"><Filter className="h-4 w-4" />Filtros avanzados<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advanced && 'rotate-180')} /></Button></div>
            {advanced && <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2 lg:grid-cols-5"><Field label="Capitalización mín. ($B)" value={filters.minMarketCap} onChange={(value: string) => setFilters({ ...filters, minMarketCap: value ? String(Number(value) * 1e9) : '' })} displayBillions /><Field label="P/E máximo" value={filters.maxPe} onChange={(value: string) => setFilters({ ...filters, maxPe: value })} /><Field label="ROIC mínimo %" value={filters.minRoic} onChange={(value: string) => setFilters({ ...filters, minRoic: value })} /><Field label="Potencial alcista mínimo %" value={filters.minUpside} onChange={(value: string) => setFilters({ ...filters, minUpside: value })} /><Field label="Rendimiento de dividendo mín. %" value={filters.minDividendYield} onChange={(value: string) => setFilters({ ...filters, minDividendYield: value })} /><Field label="Crecimiento de ingresos mín. %" value={filters.minRevenueGrowth} onChange={(value: string) => setFilters({ ...filters, minRevenueGrowth: value })} /><Field label="Crecimiento de FCF mín. %" value={filters.minFcfGrowth} onChange={(value: string) => setFilters({ ...filters, minFcfGrowth: value })} /><Field label="Deuda neta / EBITDA máx." value={filters.maxNetDebtToEbitda} onChange={(value: string) => setFilters({ ...filters, maxNetDebtToEbitda: value })} /><Field label="Piotroski mínimo" value={filters.minPiotroski} onChange={(value: string) => setFilters({ ...filters, minPiotroski: value })} /><Field label="Altman Z mínimo" value={filters.minAltman} onChange={(value: string) => setFilters({ ...filters, minAltman: value })} /></div>}
        </Card>

        {loading ? <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-500" /></div> : <>
            {data?.stale && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">Mostrando la última lectura válida mientras se recupera la fuente de mercado.</div>}
            <p className="px-1 text-xs text-muted-foreground"><b className="text-foreground">{data?.summary?.matchingCount ?? 0}</b> empresas coinciden con los filtros. {scoreLabel}</p>
            <div className="overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm">
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[1160px] text-left text-xs">
                        <thead className="border-b border-border/60 bg-muted/35 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Empresa</th>
                                <th className="px-3 py-3">Precio</th>
                                <th className="px-3 py-3">Valor razonable</th>
                                <th className="px-3 py-3">Potencial alcista</th>
                                <th className="px-3 py-3">P/E</th>
                                <th className="px-3 py-3">ROIC</th>
                                <th className="px-3 py-3">{category === 'DIVIDEND' ? 'Dividendo (Yield)' : 'Rend. FCF'}</th>
                                <th className="px-3 py-3">Puntuación</th>
                                <th className="px-3 py-3">Cobertura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <OpportunityRow key={item.ticker} item={item} category={category} onOpen={onOpenAnalysis} />
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="grid gap-3 p-3 lg:hidden">
                    {items.map((item) => (
                        <OpportunityCard key={item.ticker} item={item} category={category} onOpen={onOpenAnalysis} />
                    ))}
                </div>
                {!items.length && (
                    <div className="p-16 text-center text-sm text-muted-foreground">
                        No hay empresas con los criterios seleccionados. Probá flexibilizar un filtro.
                    </div>
                )}
            </div>
        </>}
        <Card className="rounded-[22px] border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
            <div className="flex gap-3">
                <HelpCircle className="h-5 w-5 shrink-0 text-violet-500" />
                <div>
                    <b className="text-foreground">Transparencia del score</b>
                    <p className="mt-1 leading-relaxed">
                        Valuación 30%, calidad financiera 25%, crecimiento 20%, rentabilidad 15% y balance 10%. Las métricas no provistas se señalan como sin cobertura y no se inventan; la cobertura indica qué parte del score pudo calcularse.
                    </p>
                </div>
            </div>
        </Card>
    </div>;
}

function Stat({ icon: Icon, label, value, tone }: any) {
    return (
        <div className={cn('rounded-2xl border p-3.5', tone === 'emerald' ? 'border-emerald-500/25 bg-emerald-500/10' : tone === 'violet' ? 'border-violet-500/25 bg-violet-500/10' : tone === 'amber' ? 'border-amber-500/25 bg-amber-500/10' : 'border-border/60 bg-background/60')}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange, displayBillions }: any) {
    return (
        <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
            <input type="number" value={displayBillions && value ? Number(value) / 1e9 : value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-violet-500" />
        </label>
    );
}

function OpportunityRow({ item, category, onOpen }: { item: Opportunity; category: Category; onOpen: (ticker: string) => void }) {
    return (
        <tr onClick={() => onOpen(item.ticker)} className="cursor-pointer border-b border-border/40 transition-colors hover:bg-violet-500/5">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <SymbolLogo symbol={item.symbol} size={28} />
                    <div>
                        <b className="text-sm text-foreground">{item.ticker}</b>
                        <p className="max-w-[175px] truncate text-[10px] text-muted-foreground">{item.name}</p>
                    </div>
                </div>
            </td>
            <td className="px-3 py-3 font-bold text-foreground">
                {money(item.price)}
                <p className={cn('text-[10px]', (item.change || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{format(item.change, true)}</p>
            </td>
            <td className="px-3 py-3 font-bold text-foreground">
                {money(item.fairValue)}
                <p className="text-[10px] text-muted-foreground">{item.fairValueModel ? 'DCF FCF' : 'Sin cobertura'}</p>
            </td>
            <td className={cn('px-3 py-3 font-black', (item.upside || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{format(item.upside, true)}</td>
            <td className="px-3 py-3 font-bold text-foreground">{item.pe?.toFixed(1) ?? '—'}</td>
            <td className="px-3 py-3 font-bold text-foreground">{format(item.roic)}</td>
            <td className="px-3 py-3 font-bold text-foreground">
                {category === 'DIVIDEND' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                        {item.dividendYield !== null && item.dividendYield !== undefined ? `${item.dividendYield.toFixed(2)}%` : '—'}
                    </span>
                ) : (
                    format(item.fcfYield)
                )}
            </td>
            <td className="px-3 py-3">
                <span className="rounded-lg bg-violet-500/15 px-2 py-1 font-black text-violet-700 dark:text-violet-300">{item.opportunityScore?.toFixed(0) ?? '—'}</span>
            </td>
            <td className="px-3 py-3 text-muted-foreground">{item.scoreCoverage}%</td>
        </tr>
    );
}

function OpportunityCard({ item, category, onOpen }: { item: Opportunity; category: Category; onOpen: (ticker: string) => void }) {
    return (
        <button onClick={() => onOpen(item.ticker)} className="rounded-2xl border border-border/60 bg-background/50 p-4 text-left">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SymbolLogo symbol={item.symbol} size={30} />
                    <div>
                        <b className="text-foreground">{item.ticker}</b>
                        <p className="max-w-[190px] truncate text-[10px] text-muted-foreground">{item.name}</p>
                    </div>
                </div>
                <span className="rounded-lg bg-violet-500/15 px-2 py-1 text-sm font-black text-violet-700 dark:text-violet-300">{item.opportunityScore?.toFixed(0) ?? '—'}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <Metric label="Precio" value={money(item.price)} />
                <Metric label="Valor razonable" value={money(item.fairValue)} />
                <Metric label="Potencial alcista" value={format(item.upside, true)} positive={(item.upside || 0) >= 0} />
                <Metric label="P/E" value={item.pe?.toFixed(1) ?? '—'} />
                <Metric label="ROIC" value={format(item.roic)} />
                <Metric
                    label={category === 'DIVIDEND' ? 'Dividendo' : 'Rend. FCF'}
                    value={category === 'DIVIDEND' ? (item.dividendYield ? `${item.dividendYield.toFixed(2)}%` : '—') : format(item.fcfYield)}
                    positive={category === 'DIVIDEND' ? Boolean(item.dividendYield && item.dividendYield > 0) : undefined}
                />
            </div>
        </button>
    );
}
function Metric({ label, value, positive }: any) { return <div><p className="text-[9px] font-bold uppercase text-muted-foreground">{label}</p><p className={cn('mt-0.5 font-black', positive === undefined ? 'text-foreground' : positive ? 'text-emerald-500' : 'text-rose-500')}>{value}</p></div>; }
