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
    Plus,
    ChevronRight,
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
    if (categoryKey === 'income') return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
    if (categoryKey === 'investments') return <TrendingUp className="h-4 w-4 text-sky-400" />;
    if (categoryKey === 'services') return <Receipt className="h-4 w-4 text-amber-400" />;
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
        { label: 'Disponible', value: snapshot.available, color: 'bg-emerald-500', dot: 'bg-emerald-400' },
        { label: 'Invertido', value: snapshot.invested, color: 'bg-sky-500', dot: 'bg-sky-400' },
        { label: 'Ahorro', value: snapshot.savings, color: 'bg-amber-500', dot: 'bg-amber-400' },
        { label: 'Deuda', value: snapshot.debt, color: 'bg-rose-500', dot: 'bg-rose-400' },
    ];

    return (
        <FinancePageFrame
            title="Resumen financiero"
            description="Una lectura clara de tu liquidez, patrimonio y proximos compromisos."
            onAction={() => navigate('/finanzas/movimientos?new=expense')}
            actionLabel="Nuevo movimiento"
        >
            {/* Status bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Vista consolidada · {snapshot.accounts.length} cuentas · {loading ? 'Sincronizando...' : error ? 'Revisa tu conexion' : 'Al dia'}
                </span>
                <Link to="/finanzas/configuracion" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    Personalizar resumen
                </Link>
            </div>

            {/* Main grid: Chart + Distribucion */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                {/* Chart patrimonio */}
                <FinanceSurface className="overflow-hidden rounded-2xl">
                    <div className="flex flex-col gap-5 border-b border-border/50 p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Patrimonio neto</p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <p className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                                        <FinanceAmount value={display(snapshot.netWorth)} currency={currency} />
                                    </p>
                                    <FinanceDelta value={snapshot.netWorthChange} className="mb-1.5" />
                                </div>
                                <p className="mt-1.5 text-sm text-muted-foreground">Evolucion calculada a partir de tus saldos y movimientos.</p>
                            </div>
                            <PeriodSelector value={period} onChange={setPeriod} />
                        </div>
                        <NetWorthChart points={chartPoints} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-xs text-muted-foreground sm:px-7">
                        <span>Ultima actualizacion: {snapshot.meta?.updatedAt ? new Date(snapshot.meta.updatedAt).toLocaleString('es-AR') : '—'}</span>
                        <Link to="/finanzas/analytics" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                            Analisis completo <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </FinanceSurface>

                {/* Distribucion donut */}
                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Donde esta tu dinero" eyebrow="Distribucion" />
                    <div className="mt-6 flex items-center gap-5">
                        <div
                            className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full shadow-xl"
                            style={{
                                background: 'conic-gradient(hsl(var(--primary)) 0 17%, #0ea5e9 17% 63%, #f59e0b 63% 74%, #f43f5e 74% 80%, hsl(var(--secondary)) 80% 100%)',
                            }}
                        >
                            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card text-center shadow-inner">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</span>
                                <FinanceAmount value={display(snapshot.netWorth)} currency={currency} compact className="mt-1 text-sm font-black" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-3.5">
                            {distribution.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <span className={cn('h-2.5 w-2.5 rounded-full shadow-sm', item.dot)} />
                                        {item.label}
                                    </span>
                                    <FinanceAmount value={display(item.value)} currency={currency} compact className="text-sm font-black text-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 border-t border-border/40 pt-4">
                        <Link to="/finanzas/cuentas" className="flex items-center justify-between text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                            <span>Ver cuentas y saldos</span>
                            <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                        </Link>
                    </div>
                </FinanceSurface>
            </div>

            {/* KPIs del mes */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                    { label: 'Ingresos del mes', value: snapshot.monthlyIncome, delta: 5.4, icon: ArrowDownRight, iconColor: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', link: '/finanzas/analytics' },
                    { label: 'Gastos del mes', value: snapshot.monthlyExpenses, delta: -2.1, icon: ArrowUpRight, iconColor: 'text-rose-400', bg: 'bg-rose-500/8 border-rose-500/20', link: '/finanzas/movimientos' },
                    { label: 'Ahorro del mes', value: snapshot.monthlySavings, delta: 8.7, icon: PiggyBank, iconColor: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/20', link: '/finanzas/objetivos' },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            to={item.link}
                            className={cn(
                                'group flex items-center justify-between rounded-2xl border px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md backdrop-blur-sm',
                                item.bg
                            )}
                        >
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <Icon className={cn('h-4 w-4', item.iconColor)} />
                                    {item.label}
                                </div>
                                <FinanceAmount value={display(item.value)} currency={currency} className="mt-2 block text-2xl font-black" />
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <FinanceDelta value={item.delta} />
                                <p className="text-[11px] text-muted-foreground">vs. mes anterior</p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Actividad reciente + Presupuestos */}
            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                {/* Actividad reciente */}
                <FinanceSurface className="rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border/50 px-5 py-5 sm:px-6">
                        <FinanceSectionHeading title="Actividad reciente" />
                        <ViewAllLink to="/finanzas/movimientos">Todos los movimientos</ViewAllLink>
                    </div>
                    <div className="divide-y divide-border/40">
                        {snapshot.transactions.slice(0, 6).map((transaction) => {
                            const positive = transaction.amount >= 0;
                            return (
                                <Link
                                    to={`/finanzas/movimientos?transaction=${transaction.id}`}
                                    key={transaction.id}
                                    className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-secondary/30 sm:px-6"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 border border-border/40">
                                        {categoryIcon(transaction.categoryKey)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-foreground">{transaction.description}</p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {transaction.merchant} · {formatShortDate(transaction.date)}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={cn('text-sm font-black tabular-nums', positive ? 'text-emerald-400' : 'text-foreground')}>
                                            {positive ? '+' : ''}
                                            <FinanceAmount value={display(transaction.amount)} currency={currency} />
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">{transaction.account}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="border-t border-border/40 px-5 py-3 sm:px-6">
                        <Link
                            to="/finanzas/movimientos?new=expense"
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Agregar movimiento
                        </Link>
                    </div>
                </FinanceSurface>

                {/* Presupuestos */}
                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Presupuestos" eyebrow="Este mes" action={<ViewAllLink to="/finanzas/presupuestos" />} />
                    <div className="mt-6 space-y-6">
                        {snapshot.budgets.slice(0, 3).map((budget) => {
                            const percentage = Math.round((budget.spent / budget.limit) * 100);
                            const tone = budget.tone === 'exceeded' ? 'danger' : budget.tone === 'attention' ? 'warning' : 'primary';
                            return (
                                <div key={budget.id}>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-sm font-bold text-foreground">{budget.category}</span>
                                        <span className={cn(
                                            'text-xs font-black tabular-nums px-2 py-0.5 rounded-full',
                                            budget.tone === 'exceeded' ? 'bg-rose-500/12 text-rose-400' :
                                                budget.tone === 'attention' ? 'bg-amber-500/12 text-amber-400' :
                                                    'bg-secondary text-muted-foreground'
                                        )}>
                                            {percentage}%
                                        </span>
                                    </div>
                                    <ProgressBar value={budget.spent} max={budget.limit} tone={tone} />
                                    <div className="mt-2 flex justify-between text-xs text-muted-foreground font-medium">
                                        <FinanceAmount value={display(budget.spent)} currency={currency} />
                                        <span>de {formatFinanceAmount(display(budget.limit), currency)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 border-t border-border/40 pt-4">
                        <Link to="/finanzas/presupuestos" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                            Revisar limites y categorias
                        </Link>
                    </div>
                </FinanceSurface>
            </div>

            {/* Proximos compromisos + Objetivos */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                {/* Proximos compromisos */}
                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading
                        title="Proximos compromisos"
                        eyebrow="Los proximos 14 dias"
                        action={<ViewAllLink to="/finanzas/calendario">Calendario</ViewAllLink>}
                    />
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {snapshot.events.slice(0, 4).map((event) => (
                            <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/20 p-3.5 hover:bg-secondary/30 transition-colors">
                                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-card border border-border/40 text-[10px] font-black uppercase text-emerald-400 shadow-sm">
                                    <span>{new Date(`${event.date}T12:00:00`).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
                                    <span className="text-sm text-foreground font-black">{new Date(`${event.date}T12:00:00`).getDate()}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground">{event.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {event.amount
                                            ? <FinanceAmount value={display(event.amount)} currency={currency} />
                                            : 'Recordatorio financiero'}
                                        {event.kind === 'card' ? ' · cierre' : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </FinanceSurface>

                {/* Objetivos */}
                <FinanceSurface className="rounded-2xl p-5 sm:p-6">
                    <FinanceSectionHeading title="Objetivos" eyebrow="Progreso" action={<ViewAllLink to="/finanzas/objetivos" />} />
                    <div className="mt-5 space-y-6">
                        {snapshot.goals.slice(0, 2).map((goal) => (
                            <div key={goal.id}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 text-lg shadow-sm shrink-0">
                                            {goal.icon}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">{goal.name}</p>
                                            <p className="text-xs text-muted-foreground">Objetivo {goal.deadline}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black tabular-nums text-emerald-400 shrink-0">
                                        {Math.round((goal.saved / goal.target) * 100)}%
                                    </span>
                                </div>
                                <ProgressBar value={goal.saved} max={goal.target} />
                                <div className="mt-2 flex justify-between text-xs text-muted-foreground font-medium">
                                    <FinanceAmount value={display(goal.saved)} currency={currency} />
                                    <span>de {formatFinanceAmount(display(goal.target), currency)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </FinanceSurface>
            </div>

            {/* Inversiones */}
            <FinanceSurface className="mt-6 overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-5 sm:px-6">
                    <FinanceSectionHeading title="Inversiones" eyebrow="Patrimonio invertido" />
                    <ViewAllLink to="/finanzas/inversiones">Ver cartera</ViewAllLink>
                </div>
                <div className="grid grid-cols-1 divide-y divide-border/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                    {snapshot.investments.map((investment) => (
                        <Link
                            key={investment.id}
                            to={`/finanzas/inversiones?asset=${investment.ticker}`}
                            className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/30"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 text-xs font-black text-foreground">
                                {investment.ticker.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground">{investment.ticker}</p>
                                <p className="truncate text-xs text-muted-foreground">{investment.name}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <FinanceAmount value={investment.value ?? 0} currency={currency} compact className="block text-sm font-black" />
                                <span className={cn('text-xs font-bold', investment.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                    {investment.pnlPct >= 0 ? '+' : ''}{investment.pnlPct.toFixed(1)}%
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </FinanceSurface>

            {/* Footer disclaimer */}
            <p className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Landmark className="h-3.5 w-3.5 shrink-0" />
                Solo se muestran datos que cargaste o sincronizaste en tu cuenta. Finix no mueve dinero automaticamente.
            </p>
        </FinancePageFrame>
    );
}
