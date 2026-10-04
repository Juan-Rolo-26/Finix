import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Layers, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHART_TOOLTIP_STYLE } from '../dashboard/chartUtils';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'];
const percentFormatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const pct = (value: number, signed = false) => `${signed && value > 0 ? '+' : ''}${percentFormatter.format(value)}%`;
const PANEL = 'min-w-0 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7';

function EmptyChart({ children }: { children: React.ReactNode }) {
    return <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center text-base text-muted-foreground">{children}</div>;
}

const EMPTY_RETURNS: MonthlyReturn[] = [];
type MonthlyReturn = { monthKey: string; label: string; value: number };

export function MonthlyReturnChart({ returns = EMPTY_RETURNS, totalReturn, loading = false, hidden = false }: {
    returns?: MonthlyReturn[];
    totalReturn?: string;
    loading?: boolean;
    hidden?: boolean;
}) {
    const data = useMemo(() => returns.filter(p => Number.isFinite(p.value)).slice(-12), [returns]);
    const maxAbs = Math.max(0.5, ...data.map(p => Math.abs(p.value)));
    // Leave enough room for the labels above/below each bar, including losses.
    const low = Math.min(0, ...data.map(p => p.value));
    const high = Math.max(0, ...data.map(p => p.value));
    const domain: [number, number] = [low < 0 ? low - maxAbs * 0.3 : 0, high > 0 ? high + maxAbs * 0.3 : maxAbs * 0.3];
    const monthLabel = (key: string) => {
        const item = data.find(p => p.monthKey === key);
        return item ? `${item.label.toLowerCase()} ${key.slice(2, 4)}` : key;
    };

    return (
        <section className={PANEL} aria-label="Rendimiento mensual" aria-busy={loading}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><TrendingUp className="h-6 w-6" /></span>
                    <div>
                        <h4 className="text-xl font-bold tracking-tight sm:text-2xl">Rendimiento mensual</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Variación de la cartera por mes, descontando aportes y retiros.</p>
                    </div>
                </div>
                {totalReturn && totalReturn !== '—' && <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                    <p className={cn('text-2xl font-bold tabular-nums', totalReturn.startsWith('-') ? 'text-rose-500' : 'text-emerald-500')}>{totalReturn}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Resultado sobre aportes netos</p>
                </div>}
            </div>
            {hidden ? <EmptyChart>El titular comparte sus rendimientos por rangos.</EmptyChart> : loading ? <EmptyChart>Cargando el historial del portafolio…</EmptyChart> : !data.length ? <EmptyChart>El rendimiento mensual aparecerá cuando haya mediciones suficientes.</EmptyChart> : <>
                <div className="rounded-2xl bg-secondary/20 px-1 pt-4 sm:px-3">
                    <div className="overflow-x-auto">
                        <div className="h-[300px] sm:h-[340px]" style={{ minWidth: Math.max(280, data.length * 66) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart accessibilityLayer data={data} margin={{ top: 24, right: 16, bottom: 20, left: 0 }} barCategoryGap="30%">
                                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 6" />
                                    <XAxis dataKey="monthKey" axisLine={false} tickLine={false} interval={0} tickMargin={12} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} tickFormatter={monthLabel} />
                                    <YAxis domain={domain} width={62} axisLine={false} tickLine={false} tickCount={5} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} tickFormatter={v => pct(v)} />
                                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground) / 0.45)" />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--primary) / 0.06)' }} formatter={(value: number) => [pct(value, true), 'Rendimiento']} labelFormatter={key => monthLabel(String(key))} />
                                    <Bar dataKey="value" maxBarSize={52} radius={6} isAnimationActive={false}>
                                        {data.map(p => <Cell key={p.monthKey} fill={p.value < 0 ? '#f43f5e' : '#10b981'} />)}
                                        <LabelList dataKey="value" position="top" formatter={(v: number) => pct(v, true)} style={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 700 }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <details className="mt-4 text-sm">
                    <summary className="w-fit cursor-pointer rounded-lg py-2 font-semibold text-muted-foreground hover:text-foreground">Ver rendimientos por mes</summary>
                    <div className="mt-2 overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-left"><thead className="bg-secondary/40"><tr><th className="px-4 py-3">Mes</th><th className="px-4 py-3 text-right">Rendimiento</th></tr></thead><tbody>
                            {data.map(p => <tr key={p.monthKey} className="border-t border-border"><td className="px-4 py-3">{monthLabel(p.monthKey)}</td><td className={cn('px-4 py-3 text-right font-semibold tabular-nums', p.value < 0 ? 'text-rose-500' : 'text-emerald-600')}>{pct(p.value, true)}</td></tr>)}
                        </tbody></table>
                    </div>
                </details>
            </>}
        </section>
    );
}

function classLabel(value: string) {
    const key = value.trim().toLowerCase();
    if (/cedear|acci[oó]n|stock|equity/.test(key)) return 'Acciones y CEDEARs';
    if (/cripto|crypto/.test(key)) return 'Criptomonedas';
    if (/etf/.test(key)) return 'ETFs';
    if (/bond|bono|fixed|fij[oa]/.test(key)) return 'Bonos';
    if (/cash|efectivo/.test(key)) return 'Efectivo';
    if (/commodity|materias primas/.test(key)) return 'Materias primas';
    if (/real.estate|inmueble|bienes ra[ií]ces/.test(key)) return 'Bienes raíces';
    if (key === 'unknown') return 'Otros activos';
    return value;
}

export function AllocationSummary({ data, loading = false }: { data: Record<string, number>; loading?: boolean }) {
    const [focused, setFocused] = useState<string | null>(null);
    const allocation = useMemo(() => {
        const groups = new Map<string, number>();
        for (const [rawLabel, value] of Object.entries(data)) {
            if (!Number.isFinite(value) || value <= 0) continue;
            const label = classLabel(rawLabel);
            groups.set(label, (groups.get(label) ?? 0) + value);
        }
        const total = [...groups.values()].reduce((s, v) => s + v, 0);
        return [...groups.entries()].sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, percent: value / total * 100, color: COLORS[i % COLORS.length] }));
    }, [data]);
    const selected = allocation.find(p => p.name === focused);

    return (
        <section className={PANEL} aria-label="Composición del portafolio" aria-busy={loading}>
            <div className="mb-5 flex items-start justify-between gap-3">
                <div><h4 className="text-xl font-bold tracking-tight sm:text-2xl">Composición del portafolio</h4><p className="mt-1 text-sm text-muted-foreground">Peso de cada clase según el valor actual de la cartera.</p></div>
                <Layers className="mt-1 h-6 w-6 shrink-0 text-primary" />
            </div>
            {loading ? <EmptyChart>Cargando la composición…</EmptyChart> : !allocation.length ? <EmptyChart>Agregá posiciones o efectivo para ver la composición real.</EmptyChart> : <div className="grid items-center gap-6 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
                <div className="relative mx-auto h-[260px] w-full max-w-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={86} outerRadius={113} paddingAngle={allocation.length > 1 ? 3 : 0} stroke={allocation.length === 1 ? 'none' : 'hsl(var(--card))'} strokeWidth={allocation.length === 1 ? 0 : 3} isAnimationActive={false} onMouseEnter={p => setFocused(p.name)} onMouseLeave={() => setFocused(null)}>
                                {allocation.map(p => <Cell key={p.name} fill={p.color} opacity={!selected || selected.name === p.name ? 1 : 0.35} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
                        <span className="max-w-[148px] text-sm font-medium text-muted-foreground">{selected?.name ?? 'Clases de activos'}</span>
                        <span className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{selected ? pct(selected.percent) : allocation.length}</span>
                        <span className="mt-1 text-sm text-muted-foreground">{selected ? 'de la cartera' : 'con saldo positivo'}</span>
                    </div>
                </div>
                <div className="space-y-2" aria-label="Distribución por clase">
                    {allocation.map(p => <button type="button" key={p.name} onClick={() => setFocused(p.name)} onFocus={() => setFocused(p.name)} onBlur={() => setFocused(null)} aria-label={`${p.name}: ${pct(p.percent)} de la cartera`} aria-pressed={selected?.name === p.name} className={cn('block w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', selected?.name === p.name ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-secondary/40')}>
                        <span className="flex items-center justify-between gap-3"><span className="flex items-center gap-3 text-base font-semibold"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />{p.name}</span><span className="text-lg font-bold tabular-nums">{pct(p.percent)}</span></span>
                        <span className="mt-3 block h-2.5 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${p.percent}%`, backgroundColor: p.color }} /></span>
                    </button>)}
                    <p className="flex items-center gap-2 px-4 pt-2 text-sm text-muted-foreground"><BarChart3 className="h-4 w-4 shrink-0" />Seleccioná una clase para ver su participación.</p>
                </div>
            </div>}
        </section>
    );
}
