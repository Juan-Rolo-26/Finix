import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronRight,
    Eye,
    EyeOff,
    Plus,
    RefreshCw,
    Search,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinancePreferences } from './financePreferences';
import type { FinanceCurrency, FinancePeriod, FinanceMonthPoint } from './types';
import { ProGate } from '@/components/ProGate';

export function formatFinanceAmount(value: number, currency: FinanceCurrency = 'ARS', compact = false) {
    if (compact) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency,
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    }

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'ARS' ? 0 : 2,
    }).format(value);
}

export function formatShortDate(date: string) {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
        .format(new Date(`${date}T12:00:00`))
        .replace('.', '');
}

export function formatLongDate(date: string) {
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(`${date}T12:00:00`));
}

export function FinanceAmount({ value, currency = 'ARS', compact = false, className }: { value: number; currency?: FinanceCurrency; compact?: boolean; className?: string }) {
    const hidden = useFinancePreferences((state) => state.hideValues);
    return <span className={cn('tabular-nums', className)}>{hidden ? '••••••' : formatFinanceAmount(value, currency, compact)}</span>;
}

export function FinanceDelta({ value, className }: { value: number; className?: string }) {
    const positive = value >= 0;
    return (
        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold tabular-nums', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', className)}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {positive ? '+' : ''}{value.toFixed(1)}%
        </span>
    );
}

export function FinanceSurface({ children, className, as = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' }) {
    const Component = as;
    return <Component className={cn('border border-border/70 bg-card shadow-sm', className)}>{children}</Component>;
}

export function FinanceSectionHeading({ title, eyebrow, action, className }: { title: string; eyebrow?: string; action?: ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-end justify-between gap-4', className)}>
            <div>
                {eyebrow ? <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
                <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
            </div>
            {action}
        </div>
    );
}

const PERIODS: Array<{ value: FinancePeriod; label: string }> = [
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: 'YTD', label: 'YTD' },
    { value: '1A', label: '1A' },
    { value: 'ALL', label: 'Todo' },
];

export function PeriodSelector({ value, onChange }: { value: FinancePeriod; onChange: (value: FinancePeriod) => void }) {
    return (
        <div className="inline-flex items-center rounded-lg border border-border bg-secondary/50 p-0.5" aria-label="Período">
            {PERIODS.map((period) => (
                <button
                    key={period.value}
                    type="button"
                    onClick={() => onChange(period.value)}
                    className={cn('rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors', value === period.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                    aria-pressed={value === period.value}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}

const financeNav = [
    { label: 'Resumen', path: '/finanzas' },
    { label: 'Cuentas', path: '/finanzas/cuentas' },
    { label: 'Movimientos', path: '/finanzas/movimientos' },
    { label: 'Presupuestos', path: '/finanzas/presupuestos' },
    { label: 'Objetivos', path: '/finanzas/objetivos' },
    { label: 'Inversiones', path: '/finanzas/inversiones' },
    { label: 'Tarjetas', path: '/finanzas/tarjetas' },
    { label: 'Calendario', path: '/finanzas/calendario' },
    { label: 'Analytics', path: '/finanzas/analytics' },
];

export function FinancePageFrame({ title, description, children, actionLabel = 'Nuevo', onAction, showAction = true, status = 'Conectado a tu cuenta' }: { title: string; description: string; children: ReactNode; actionLabel?: string; onAction?: () => void; showAction?: boolean; status?: string }) {
    const location = useLocation();
    const hideValues = useFinancePreferences((state) => state.hideValues);
    const toggleHideValues = useFinancePreferences((state) => state.toggleHideValues);
    const currency = useFinancePreferences((state) => state.currency);
    const setCurrency = useFinancePreferences((state) => state.setCurrency);

    return (
        <ProGate section="finance" title="Finanzas personales en Finix PRO" description="Tus cuentas, movimientos y objetivos en un espacio privado conectado a tu cuenta Finix." features={[{ title: 'Un solo resumen', desc: 'Patrimonio, liquidez, ahorro y compromisos en una vista clara.' }, { title: 'Registros reales', desc: 'Cuentas, movimientos, presupuestos y metas guardados en la base de datos.' }, { title: 'Privacidad por usuario', desc: 'Cada usuario solo accede a sus propios datos financieros.' }]}>
        <div className="min-h-screen bg-background px-4 pb-24 pt-5 text-foreground sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
            <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                <aside className="hidden lg:block">
                    <div className="sticky top-6 rounded-2xl border border-border/70 bg-card/70 p-3">
                        <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Finanzas personales</p>
                        <nav className="space-y-1" aria-label="Navegación financiera">
                            {financeNav.map((item) => {
                                const active = item.path === '/finanzas' ? location.pathname === item.path || location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
                                return <Link key={item.path} to={item.path} className={cn('flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><span className={cn('mr-3 h-1.5 w-1.5 rounded-full', active ? 'bg-primary' : 'bg-border-strong')} />{item.label}</Link>;
                            })}
                        </nav>
                    </div>
                </aside>
                <main className="min-w-0">
                <header className="mb-6 border-b border-border/70 pb-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Finanzas personales</p>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{status} · actualizado ahora
                            </span>
                            <button type="button" onClick={toggleHideValues} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" aria-label={hideValues ? 'Mostrar importes' : 'Ocultar importes'}>
                                {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="hidden sm:inline">{hideValues ? 'Mostrar' : 'Ocultar'}</span>
                            </button>
                            <label className="sr-only" htmlFor="finance-currency">Moneda principal</label>
                            <select id="finance-currency" value={currency} onChange={(event) => setCurrency(event.target.value as FinanceCurrency)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                            {showAction ? <Button onClick={onAction} leftIcon={<Plus className="h-4 w-4" />}>{actionLabel}</Button> : null}
                        </div>
                    </div>
                    <nav className="mt-5 -mb-5 flex gap-1 overflow-x-auto pb-px lg:hidden" aria-label="Navegación financiera">
                        {financeNav.map((item) => {
                            const active = item.path === '/finanzas' ? location.pathname === item.path || location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
                            return <Link key={item.path} to={item.path} className={cn('whitespace-nowrap border-b-2 px-2 py-3 text-xs font-semibold transition-colors sm:px-3', active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{item.label}</Link>;
                        })}
                    </nav>
                </header>
                {children}
                </main>
            </div>
        </div>
        </ProGate>
    );
}

export function PrivacyToggle() {
    const hidden = useFinancePreferences((state) => state.hideValues);
    const toggle = useFinancePreferences((state) => state.toggleHideValues);
    return <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground" aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}>{hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {hidden ? 'Valores ocultos' : 'Ocultar valores'}</button>;
}

export function NetWorthChart({ points, height = 250 }: { points: FinanceMonthPoint[]; height?: number }) {
    const currency = useFinancePreferences((state) => state.currency);
    return (
        <div style={{ height }} className="w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 5" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(value) => formatFinanceAmount(Number(value), currency, true)} width={56} />
                    <Tooltip
                        cursor={{ stroke: 'hsl(var(--primary))', strokeDasharray: '3 3' }}
                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                        formatter={(value: number) => [formatFinanceAmount(value, currency), 'Patrimonio']}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="hsl(var(--primary))" fillOpacity={0.11} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ProgressBar({ value, max, tone = 'primary' }: { value: number; max: number; tone?: 'primary' | 'warning' | 'danger' | 'muted' }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const toneClass = tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-rose-500' : tone === 'muted' ? 'bg-slate-500' : 'bg-primary';
    return <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={cn('h-full rounded-full transition-all', toneClass)} style={{ width: `${percentage}%` }} /></div>;
}

export function SearchField({ value, onChange, placeholder = 'Buscar' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
    return <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" /></div>;
}

export function ViewAllLink({ to, children = 'Ver todo' }: { to: string; children?: ReactNode }) {
    return <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{children}<ChevronRight className="h-3.5 w-3.5" /></Link>;
}

export function SyncButton({ onClick }: { onClick?: () => void }) {
    return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><RefreshCw className="h-3.5 w-3.5" />Sincronizar</button>;
}
