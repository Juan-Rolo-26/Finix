import { useMemo, useState } from 'react';
import { ArrowDownRight, Info, TrendingUp } from 'lucide-react';
import { useFinanceSnapshot } from '@/features/finance/financeApi';
import { useFinancePreferences } from '@/features/finance/financePreferences';
import type { FinancePeriod } from '@/features/finance/types';
import { FinanceAmount, FinanceDelta, FinancePageFrame, FinanceSectionHeading, FinanceSurface, NetWorthChart, PeriodSelector } from '@/features/finance/FinanceComponents';
import { cn } from '@/lib/utils';

export default function FinanceAnalytics() {
    const [period, setPeriod] = useState<FinancePeriod>('1A');
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot } = useFinanceSnapshot();
    const points = useMemo(() => {
        const history = snapshot.netWorthHistory;
        if (period === '1M') return history.slice(-2);
        if (period === '3M') return history.slice(-3);
        if (period === '6M') return history.slice(-6);
        if (period === 'YTD') return history.slice(-9);
        if (period === '1A') return history.slice(-12);
        return history;
    }, [period, snapshot.netWorthHistory]);
    const categoryExpenses = useMemo(() => {
        const grouped = new Map<string, number>();
        snapshot.transactions.filter((item) => item.amount < 0).forEach((item) => grouped.set(item.category, (grouped.get(item.category) || 0) + Math.abs(item.amount)));
        const total = [...grouped.values()].reduce((sum, value) => sum + value, 0);
        return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, amount], index) => ({ label, amount, percentage: total ? (amount / total) * 100 : 0, tone: ['bg-primary', 'bg-sky-500', 'bg-amber-500', 'bg-slate-500', 'bg-violet-500', 'bg-rose-400'][index] }));
    }, [snapshot.transactions]);
    const cashflow = snapshot.netWorthHistory.slice(-6);
    const recurringTotal = snapshot.recurring.reduce((sum, payment) => sum + payment.amount, 0);

    return <FinancePageFrame title="Analytics" description="Detectá patrones de gasto, ritmo de ahorro y evolución patrimonial con contexto.">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <FinanceSurface className="rounded-2xl p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><FinanceSectionHeading title="Evolución patrimonial" eyebrow="Patrimonio neto" /><PeriodSelector value={period} onChange={setPeriod} /></div>{points.length ? <NetWorthChart points={points} height={280} /> : <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Cargá movimientos o cuentas para construir tu evolución.</div>}<div className="mt-3 flex flex-wrap gap-5 border-t border-border/70 pt-4 text-xs text-muted-foreground"><span><strong className="font-semibold text-foreground">{snapshot.netWorthChange.toFixed(1)}%</strong> en el período</span><span><strong className="font-semibold text-foreground"><FinanceAmount value={snapshot.monthlySavings} currency={currency} /></strong> ahorrados este mes</span><span>Actualizado desde tus datos reales</span></div></FinanceSurface>
            <FinanceSurface className="rounded-2xl p-5 sm:p-6"><FinanceSectionHeading title="Indicadores clave" eyebrow="Este mes" /><div className="mt-5 divide-y divide-border/60">{[{ label: 'Tasa de ahorro', value: `${snapshot.savingsRate.toFixed(1)}%`, delta: snapshot.savingsRate, icon: '◒' }, { label: 'Gastos recurrentes', value: <FinanceAmount value={recurringTotal} currency={currency} />, delta: 0, icon: '↻' }, { label: 'Cambio patrimonial', value: `${snapshot.netWorthChange >= 0 ? '+' : ''}${snapshot.netWorthChange.toFixed(1)}%`, delta: snapshot.netWorthChange, icon: '↗' }].map((metric) => <div key={metric.label} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">{metric.icon}</div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="mt-1 text-lg font-semibold">{metric.value}</p></div><FinanceDelta value={metric.delta} /></div>)}</div><div className="mt-6 flex gap-2 rounded-xl border border-border bg-secondary/35 p-3 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />El análisis combina saldos, movimientos, inversiones y deudas que registraste.</div></FinanceSurface>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2"><FinanceSurface className="rounded-2xl p-5 sm:p-6"><FinanceSectionHeading title="En qué gastás" eyebrow="Mes actual" /><div className="mt-6 space-y-4">{categoryExpenses.map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="font-medium">{item.label}</span><span className="tabular-nums text-muted-foreground">{item.percentage.toFixed(1)}% · <FinanceAmount value={item.amount} currency={currency} /></span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={cn('h-full rounded-full', item.tone)} style={{ width: `${item.percentage}%` }} /></div></div>)}{categoryExpenses.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay gastos categorizados.</p> : null}</div></FinanceSurface><FinanceSurface className="rounded-2xl p-5 sm:p-6"><FinanceSectionHeading title="Ingresos vs. gastos" eyebrow="Últimos seis meses" /><div className="mt-6 space-y-4">{cashflow.map((month) => { const ratio = month.income ? Math.min((month.expenses / month.income) * 100, 100) : 0; return <div key={month.label} className="grid grid-cols-[35px_1fr_84px] items-center gap-3 text-xs"><span className="font-semibold text-muted-foreground">{month.label}</span><div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} /></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-rose-400" style={{ width: `${ratio}%` }} /></div></div><div className="text-right tabular-nums text-muted-foreground"><p className="text-emerald-600 dark:text-emerald-400">{Math.round(month.income / 1000)}k</p><p className="text-rose-600 dark:text-rose-400">{Math.round(month.expenses / 1000)}k</p></div></div>; })}{cashflow.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Necesitamos movimientos de al menos un mes para comparar.</p> : null}</div><div className="mt-5 flex gap-4 border-t border-border/70 pt-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ingresos</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Gastos</span></div></FinanceSurface></div>
        <FinanceSurface className="mt-6 rounded-2xl p-5 sm:p-6"><FinanceSectionHeading title="Lecturas útiles" eyebrow="Insights" /><div className="mt-5 grid gap-3 md:grid-cols-3"><Insight text={snapshot.monthlyIncome ? `Tu tasa de ahorro actual es ${snapshot.savingsRate.toFixed(1)}% sobre ingresos de este mes.` : 'Agregá un ingreso para conocer tu tasa de ahorro.'} tone="positive" /><Insight text={`${snapshot.recurring.length} pagos recurrentes activos por ${new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(recurringTotal)}.`} tone="neutral" /><Insight text={snapshot.debt ? `Tenés deuda registrada por ${new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(snapshot.debt)}.` : 'No tenés deuda de tarjetas registrada.'} tone={snapshot.debt ? 'neutral' : 'positive'} /></div></FinanceSurface>
    </FinancePageFrame>;
}

function Insight({ text, tone }: { text: string; tone: 'positive' | 'neutral' }) {
    return <div className="flex gap-3 rounded-xl border border-border/70 bg-secondary/25 p-4"><span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tone === 'positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400')}>{tone === 'positive' ? <ArrowDownRight className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}</span><p className="text-sm leading-5 text-foreground/80">{text}</p></div>;
}
