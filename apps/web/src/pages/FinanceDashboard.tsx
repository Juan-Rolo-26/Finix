import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowDownRight,
    ArrowUpRight,
    Landmark,
    PiggyBank,
    Receipt,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useFinancePreferences } from '@/features/finance/financePreferences';
import { useFinanceSnapshot } from '@/features/finance/financeApi';
import type { FinancePeriod } from '@/features/finance/types';
import {
    FinanceAmount,
    FinanceDelta,
    FinancePageFrame,
    FinanceSectionHeading,
    FinanceSurface,
    NetWorthChart,
    PeriodSelector,
    ProgressBar,
    ViewAllLink,
    formatShortDate,
    formatFinanceAmount,
} from '@/features/finance/FinanceComponents';
import { cn } from '@/lib/utils';

function categoryIcon(categoryKey: string) {
    if (categoryKey === 'income') return <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    if (categoryKey === 'investments') return <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    if (categoryKey === 'services') return <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    return <Wallet className="h-4 w-4 text-muted-foreground" />;
}

export default function FinanceDashboard() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<FinancePeriod>('1A');
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, loading, error } = useFinanceSnapshot();
    const display = (value: number) => value;
    const chartPoints = useMemo(() => {
        const points = period === '1M' ? snapshot.netWorthHistory.slice(-2) : period === '3M' ? snapshot.netWorthHistory.slice(-3) : period === '6M' ? snapshot.netWorthHistory.slice(-6) : period === 'YTD' ? snapshot.netWorthHistory.slice(-9) : period === '1A' ? snapshot.netWorthHistory : snapshot.netWorthHistory;
        return points;
    }, [period, snapshot.netWorthHistory]);

    const distribution = [
        { label: 'Disponible', value: snapshot.available, color: 'bg-primary' },
        { label: 'Invertido', value: snapshot.invested, color: 'bg-sky-500' },
        { label: 'Ahorro', value: snapshot.savings, color: 'bg-amber-500' },
        { label: 'Deuda', value: snapshot.debt, color: 'bg-rose-500' },
    ];

    return (
        <FinancePageFrame
            title="Resumen financiero"
            description="Una lectura clara de tu liquidez, patrimonio y próximos compromisos."
            onAction={() => navigate('/finanzas/movimientos?new=expense')}
            actionLabel="Nuevo movimiento"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Vista consolidada · {snapshot.accounts.length} cuentas registradas · {loading ? 'Sincronizando…' : error ? 'Revisá tu conexión' : 'Datos guardados en tu cuenta'}</span>
                <Link to="/finanzas/configuracion" className="font-semibold text-primary hover:underline">Personalizar resumen</Link>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                <FinanceSurface className="overflow-hidden rounded-2xl">
                    <div className="flex flex-col gap-5 border-b border-border/70 p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Patrimonio neto</p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl"><FinanceAmount value={display(snapshot.netWorth)} currency={currency} /></p>
                                    <FinanceDelta value={snapshot.netWorthChange} className="mb-1" />
                                </div>
                                    <p className="mt-1 text-sm text-muted-foreground">Evolución calculada a partir de tus saldos y movimientos.</p>
                            </div>
                            <PeriodSelector value={period} onChange={setPeriod} />
                        </div>
                        <NetWorthChart points={chartPoints} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted-foreground sm:px-7">
                        <span>Última actualización: {snapshot.meta?.updatedAt ? new Date(snapshot.meta.updatedAt).toLocaleString('es-AR') : '—'}</span>
                        <Link to="/finanzas/analytics" className="font-semibold text-primary hover:underline">Abrir análisis completo</Link>
                    </div>
                </FinanceSurface>

                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Dónde está tu dinero" eyebrow="Distribución" />
                    <div className="mt-6 flex items-center gap-5">
                        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(hsl(var(--primary)) 0 17%, #0ea5e9 17% 63%, #f59e0b 63% 74%, #f43f5e 74% 80%, hsl(var(--secondary)) 80% 100%)' }}>
                            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card text-center">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
                                <FinanceAmount value={display(snapshot.netWorth)} currency={currency} compact className="mt-1 text-sm font-bold" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                            {distribution.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="flex items-center gap-2 text-muted-foreground"><span className={cn('h-2 w-2 rounded-full', item.color)} />{item.label}</span>
                                    <FinanceAmount value={display(item.value)} currency={currency} compact className="font-semibold text-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 border-t border-border/70 pt-4">
                        <Link to="/finanzas/cuentas" className="flex items-center justify-between text-sm font-semibold"><span>Ver cuentas y saldos</span><ArrowUpRight className="h-4 w-4 text-primary" /></Link>
                    </div>
                </FinanceSurface>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                    { label: 'Ingresos del mes', value: snapshot.monthlyIncome, delta: 5.4, icon: ArrowDownRight, tone: 'text-emerald-600 dark:text-emerald-400', link: '/finanzas/analytics' },
                    { label: 'Gastos del mes', value: snapshot.monthlyExpenses, delta: -2.1, icon: ArrowUpRight, tone: 'text-rose-600 dark:text-rose-400', link: '/finanzas/movimientos' },
                    { label: 'Ahorro del mes', value: snapshot.monthlySavings, delta: 8.7, icon: PiggyBank, tone: 'text-amber-600 dark:text-amber-400', link: '/finanzas/objetivos' },
                ].map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.label} to={item.link} className="group flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm transition-colors hover:border-primary/50"><div><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Icon className={cn('h-4 w-4', item.tone)} />{item.label}</div><FinanceAmount value={display(item.value)} currency={currency} className="mt-2 block text-xl font-semibold" /></div><div className="text-right"><FinanceDelta value={item.delta} /><p className="mt-1 text-[11px] text-muted-foreground">vs. mes anterior</p></div></Link>;
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <FinanceSurface className="rounded-2xl">
                    <div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-6"><FinanceSectionHeading title="Actividad reciente" /><ViewAllLink to="/finanzas/movimientos">Todos los movimientos</ViewAllLink></div>
                    <div className="divide-y divide-border/60">
                        {snapshot.transactions.slice(0, 6).map((transaction) => {
                            const positive = transaction.amount >= 0;
                            return <Link to={`/finanzas/movimientos?transaction=${transaction.id}`} key={transaction.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/35 sm:px-6"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">{categoryIcon(transaction.categoryKey)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{transaction.description}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.merchant} · {formatShortDate(transaction.date)}</p></div><div className="text-right"><p className={cn('text-sm font-semibold tabular-nums', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>{positive ? '+' : ''}<FinanceAmount value={display(transaction.amount)} currency={currency} /></p><p className="mt-0.5 text-[11px] text-muted-foreground">{transaction.account}</p></div></Link>;
                        })}
                    </div>
                </FinanceSurface>

                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Presupuestos" eyebrow="Este mes" action={<ViewAllLink to="/finanzas/presupuestos" />} />
                    <div className="mt-5 space-y-5">
                        {snapshot.budgets.slice(0, 3).map((budget) => {
                            const percentage = Math.round((budget.spent / budget.limit) * 100);
                            const tone = budget.tone === 'exceeded' ? 'danger' : budget.tone === 'attention' ? 'warning' : 'primary';
                            return <div key={budget.id}><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium">{budget.category}</span><span className={cn('text-xs font-semibold tabular-nums', budget.tone === 'exceeded' ? 'text-rose-600 dark:text-rose-400' : budget.tone === 'attention' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{percentage}%</span></div><ProgressBar value={budget.spent} max={budget.limit} tone={tone} /><div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><FinanceAmount value={display(budget.spent)} currency={currency} /><span>de {formatFinanceAmount(display(budget.limit), currency)}</span></div></div>;
                        })}
                    </div>
                    <div className="mt-6 border-t border-border/70 pt-4"><Link to="/finanzas/presupuestos" className="text-xs font-semibold text-primary hover:underline">Revisar límites y categorías</Link></div>
                </FinanceSurface>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Próximos compromisos" eyebrow="Los próximos 14 días" action={<ViewAllLink to="/finanzas/calendario">Calendario</ViewAllLink>} />
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {snapshot.events.slice(0, 4).map((event) => <div key={event.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3.5"><div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-card text-[10px] font-bold uppercase text-primary"><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span><span className="text-sm text-foreground">{new Date(`${event.date}T12:00:00`).getDate()}</span></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{event.amount ? <FinanceAmount value={display(event.amount)} currency={currency} /> : 'Recordatorio financiero'}{event.kind === 'card' ? ' · cierre' : ''}</p></div></div>)}
                    </div>
                </FinanceSurface>

                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Objetivos" eyebrow="Progreso" action={<ViewAllLink to="/finanzas/objetivos" />} />
                    <div className="mt-5 space-y-5">
                        {snapshot.goals.slice(0, 2).map((goal) => <div key={goal.id}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-lg text-primary">{goal.icon}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{goal.name}</p><p className="text-xs text-muted-foreground">Objetivo {goal.deadline}</p></div></div><span className="text-xs font-bold tabular-nums text-primary">{Math.round((goal.saved / goal.target) * 100)}%</span></div><ProgressBar value={goal.saved} max={goal.target} /><div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><FinanceAmount value={display(goal.saved)} currency={currency} /><span>de {formatFinanceAmount(display(goal.target), currency)}</span></div></div>)}
                    </div>
                </FinanceSurface>
            </div>

            <FinanceSurface className="mt-8 overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-6"><FinanceSectionHeading title="Inversiones" eyebrow="Patrimonio invertido" /><ViewAllLink to="/finanzas/inversiones">Ver cartera</ViewAllLink></div>
                <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                    {snapshot.investments.map((investment) => <Link key={investment.id} to={`/finanzas/inversiones?asset=${investment.ticker}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/35"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-[11px] font-bold text-foreground">{investment.ticker.slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{investment.ticker}</p><p className="truncate text-xs text-muted-foreground">{investment.name}</p></div><div className="text-right"><FinanceAmount value={investment.value ?? 0} currency={currency} compact className="block text-sm font-semibold" /><span className={cn('text-[11px] font-semibold', investment.pnlPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{investment.pnlPct >= 0 ? '+' : ''}{investment.pnlPct.toFixed(1)}%</span></div></Link>)}
                </div>
            </FinanceSurface>

            <p className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground"><Landmark className="h-3.5 w-3.5" /> Solo se muestran datos que cargaste o sincronizaste en tu cuenta. Finix no mueve dinero automáticamente.</p>
        </FinancePageFrame>
    );
}
