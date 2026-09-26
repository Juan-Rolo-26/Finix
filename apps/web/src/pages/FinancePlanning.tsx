import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Check, CreditCard, Plus, ShieldCheck, Target, WalletCards } from 'lucide-react';
import { createFinanceRecord, useFinanceSnapshot } from '@/features/finance/financeApi';
import { useFinancePreferences } from '@/features/finance/financePreferences';
import { FinanceAmount, FinancePageFrame, FinanceSectionHeading, FinanceSurface, ProgressBar, formatLongDate } from '@/features/finance/FinanceComponents';
import { cn } from '@/lib/utils';

export default function FinancePlanning() {
    const location = useLocation();
    if (location.pathname.includes('/objetivos')) return <FinanceGoals />;
    if (location.pathname.includes('/tarjetas')) return <FinanceCards />;
    if (location.pathname.includes('/calendario')) return <FinanceCalendar />;
    return <FinanceBudgets />;
}

const askNumber = (label: string) => {
    const value = Number(window.prompt(label, '0') || 0);
    return Number.isFinite(value) && value >= 0 ? value : null;
};

export function FinanceBudgets() {
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, reload } = useFinanceSnapshot();
    const addBudget = async () => {
        const category = window.prompt('Categoría del presupuesto');
        const limit = askNumber('Límite mensual');
        if (!category?.trim() || limit === null) return;
        await createFinanceRecord('budgets', { category: category.trim(), categoryKey: category.trim().toLowerCase().replace(/ /g, '_'), limit, month: new Date().getMonth() + 1, year: new Date().getFullYear() });
        await reload();
    };
    return <FinancePageFrame title="Presupuestos" description="Poné límites que te ayuden a decidir, no reglas que te hagan sentir castigado." actionLabel="Nuevo presupuesto" onAction={() => void addBudget()}><div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{snapshot.budgets.map((budget) => { const percentage = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0; const exceeded = budget.tone === 'exceeded'; const attention = budget.tone === 'attention'; return <FinanceSurface key={budget.id} className="rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Categoría</p><h2 className="mt-1 text-lg font-semibold">{budget.category}</h2></div><span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', exceeded ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : attention ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')}>{exceeded ? 'Excedido' : attention ? 'Cerca del límite' : 'Saludable'}</span></div><div className="mt-8 flex items-end justify-between"><FinanceAmount value={budget.spent} currency={currency} className="text-2xl font-semibold" /><span className="text-xs text-muted-foreground">de <FinanceAmount value={budget.limit} currency={currency} /></span></div><div className="mt-3"><ProgressBar value={budget.spent} max={budget.limit} tone={exceeded ? 'danger' : attention ? 'warning' : 'primary'} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{percentage}% utilizado</span><span>{exceeded ? 'Revisar límite' : `${Math.max(budget.limit - budget.spent, 0).toLocaleString('es-AR')} disponible`}</span></div></FinanceSurface>; })}<button type="button" onClick={() => void addBudget()} className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 text-center hover:border-primary/60 hover:bg-primary/5"><Plus className="h-5 w-5 text-primary" /><span className="mt-3 text-sm font-semibold">Crear presupuesto</span><span className="mt-1 max-w-[210px] text-xs leading-5 text-muted-foreground">Por categoría, comercio, cuenta o grupo personalizado</span></button></div><div className="mt-6 flex gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />El consumo se calcula con tus movimientos del mes seleccionado.</div></FinancePageFrame>;
}

export function FinanceGoals() {
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, reload } = useFinanceSnapshot();
    const addGoal = async () => {
        const name = window.prompt('Nombre del objetivo');
        const target = askNumber('Monto objetivo');
        if (!name?.trim() || target === null) return;
        await createFinanceRecord('goals', { name: name.trim(), target, saved: 0, currency: snapshot.currency });
        await reload();
    };
    return <FinancePageFrame title="Objetivos de ahorro" description="Convertí planes concretos en aportes visibles y una fecha posible." actionLabel="Nuevo objetivo" onAction={() => void addGoal()}><div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{snapshot.goals.map((goal) => { const percentage = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0; return <FinanceSurface key={goal.id} className="rounded-2xl p-5"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-xl text-primary">{goal.icon}</span><span className="text-xs font-semibold text-primary">{percentage}%</span></div><h2 className="mt-6 text-lg font-semibold">{goal.name}</h2><p className="mt-1 text-xs text-muted-foreground">Fecha objetivo: {goal.deadline ? formatLongDate(goal.deadline) : 'Sin fecha'}</p><div className="mt-8 flex items-end justify-between"><div><FinanceAmount value={goal.saved} currency={currency} className="block text-2xl font-semibold" /><span className="text-xs text-muted-foreground">de <FinanceAmount value={goal.target} currency={currency} /></span></div></div><div className="mt-4"><ProgressBar value={goal.saved} max={goal.target} /></div><div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs"><span className="text-muted-foreground">Aporte sugerido</span><span className="font-semibold"><FinanceAmount value={goal.monthlyContribution} currency={currency} /> / mes</span></div></FinanceSurface>; })}<button type="button" onClick={() => void addGoal()} className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 text-center hover:border-primary/60 hover:bg-primary/5"><Target className="h-6 w-6 text-primary" /><span className="mt-3 text-sm font-semibold">Definir un nuevo objetivo</span><span className="mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">Viaje, fondo de emergencia, casa o cualquier meta personal</span></button></div></FinancePageFrame>;
}

export function FinanceCards() {
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, reload } = useFinanceSnapshot();
    const [showDetails, setShowDetails] = useState(false);
    const addCard = async () => {
        const name = window.prompt('Nombre de la tarjeta');
        const limit = askNumber('Límite de la tarjeta');
        if (!name?.trim() || limit === null) return;
        await createFinanceRecord('cards', { name: name.trim(), brand: 'Visa', creditLimit: limit, currency: snapshot.currency });
        await reload();
    };
    const card = snapshot.cards[0];
    const cardEvents = snapshot.events.filter((event) => event.kind === 'card');
    return <FinancePageFrame title="Tarjetas" description="Entendé consumo, disponible y compromisos futuros antes del próximo cierre." actionLabel="Agregar tarjeta" onAction={() => void addCard()}><div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)]"><FinanceSurface className="overflow-hidden rounded-2xl">{card ? <><div className="bg-slate-900 p-6 text-white dark:bg-slate-800"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-white/60">{card.name}</p><p className="mt-8 text-2xl font-semibold tracking-widest">•••• {card.last4 || '----'}</p></div><span className="text-sm font-bold italic">{card.brand}</span></div><div className="mt-8 flex items-end justify-between"><div><p className="text-[11px] text-white/60">Cierra</p><p className="mt-1 text-sm font-semibold">Día {card.closingDay || '—'}</p></div><div className="text-right"><p className="text-[11px] text-white/60">Vence</p><p className="mt-1 text-sm font-semibold">Día {card.dueDay || '—'}</p></div></div></div><div className="space-y-4 p-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Consumido</span><FinanceAmount value={card.currentBalance} currency={currency} className="font-semibold" /></div><ProgressBar value={card.currentBalance} max={card.creditLimit} tone="warning" /><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Disponible</span><FinanceAmount value={Math.max(card.creditLimit - card.currentBalance, 0)} currency={currency} className="font-semibold text-emerald-600 dark:text-emerald-400" /></div><div className="border-t border-border/70 pt-4 text-xs text-muted-foreground">Límite total <FinanceAmount value={card.creditLimit} currency={currency} className="font-semibold text-foreground" /></div></div></> : <div className="p-8 text-center"><CreditCard className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-sm font-semibold">Todavía no agregaste tarjetas</p><button type="button" onClick={() => void addCard()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Agregar tarjeta</button></div>}</FinanceSurface><FinanceSurface className="rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><FinanceSectionHeading title="Próximos vencimientos" eyebrow="Calendario de tarjetas" /><button type="button" onClick={() => setShowDetails(!showDetails)} className="text-xs font-semibold text-primary">{showDetails ? 'Ocultar' : 'Ver detalle'}</button></div><div className="mt-5 divide-y divide-border/60">{cardEvents.map((event) => <div key={event.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"><CreditCard className="h-4 w-4 text-primary" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{event.title}</p><p className="text-xs text-muted-foreground">{formatLongDate(event.date)}</p>{showDetails ? <p className="mt-1 text-[11px] text-muted-foreground">Evento generado desde tu tarjeta guardada.</p> : null}</div>{event.amount !== undefined ? <FinanceAmount value={event.amount} currency={currency} className="text-sm font-semibold" /> : null}</div>)}{cardEvents.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No hay vencimientos configurados.</p> : null}</div></FinanceSurface></div></FinancePageFrame>;
}

export function FinanceCalendar() {
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, reload } = useFinanceSnapshot();
    const recurringTotal = snapshot.events.filter((event) => event.kind === 'subscription').reduce((total, event) => total + (event.amount || 0), 0);
    const addRecurring = async () => {
        const name = window.prompt('Nombre del pago recurrente');
        const amount = askNumber('Importe');
        if (!name?.trim() || amount === null) return;
        const date = window.prompt('Próxima fecha (AAAA-MM-DD)', new Date().toISOString().slice(0, 10));
        if (!date) return;
        await createFinanceRecord('recurring', { name: name.trim(), amount, nextDate: date, currency: snapshot.currency, category: 'Suscripciones' });
        await reload();
    };
    return <FinancePageFrame title="Calendario financiero" description="Vencimientos, ingresos esperados, suscripciones y aportes en una sola línea de tiempo." actionLabel="Agregar pago" onAction={() => void addRecurring()}><FinanceSurface className="rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Agenda conectada</p><h2 className="mt-1 text-2xl font-semibold">Próximos eventos</h2></div></div><div className="mt-5 space-y-3">{snapshot.events.map((event) => <div key={event.id} className="grid grid-cols-[46px_1fr_auto] items-center gap-4 rounded-xl border border-border/60 bg-secondary/20 p-3.5"><div className="text-center"><p className="text-[10px] font-bold uppercase text-muted-foreground">{new Date(`${event.date}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</p><p className="mt-0.5 text-lg font-semibold">{new Date(`${event.date}T12:00:00`).getDate()}</p></div><div><p className="text-sm font-semibold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{event.kind === 'card' ? 'Tarjeta de crédito' : event.kind === 'goal' ? 'Objetivo de ahorro' : 'Pago recurrente'}</p></div><p className="text-right text-sm font-semibold">{event.amount !== undefined ? <FinanceAmount value={event.amount} currency={currency} /> : '—'}</p></div>)}{snapshot.events.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No hay eventos próximos. Agregá una tarjeta o un pago recurrente para verlos acá.</div> : null}</div></FinanceSurface><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="flex gap-3 rounded-xl border border-border bg-card p-4"><CalendarDays className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold">{snapshot.events.length} eventos</p><p className="mt-1 text-xs text-muted-foreground">Generados desde tus registros</p></div></div><div className="flex gap-3 rounded-xl border border-border bg-card p-4"><WalletCards className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold"><FinanceAmount value={recurringTotal} currency={currency} /></p><p className="mt-1 text-xs text-muted-foreground">Pagos recurrentes próximos</p></div></div><div className="flex gap-3 rounded-xl border border-border bg-card p-4"><Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><div><p className="text-sm font-semibold">Agenda activa</p><p className="mt-1 text-xs text-muted-foreground">Se actualiza desde la base</p></div></div></div></FinancePageFrame>;
}
