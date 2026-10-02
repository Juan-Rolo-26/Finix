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
    Wallet,
    TrendingUp,
    PiggyBank,
    CreditCard,
    Calendar,
    BarChart3,
    Settings,
    LayoutDashboard,
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
        <span className={cn('inline-flex items-center gap-1 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full', positive ? 'bg-emerald-500/12 text-emerald-400' : 'bg-rose-500/12 text-rose-400', className)}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {positive ? '+' : ''}{value.toFixed(1)}%
        </span>
    );
}

export function FinanceSurface({ children, className, as = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' }) {
    const Component = as;
    return <Component className={cn('border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm', className)}>{children}</Component>;
}

export function FinanceSectionHeading({ title, eyebrow, action, className }: { title: string; eyebrow?: string; action?: ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-end justify-between gap-4', className)}>
            <div>
                {eyebrow ? <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">{eyebrow}</p> : null}
                <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{title}</h2>
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
        <div className="inline-flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1 gap-0.5" aria-label="Periodo">
            {PERIODS.map((period) => (
                <button
                    key={period.value}
                    type="button"
                    onClick={() => onChange(period.value)}
                    className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                        value === period.value
                            ? 'bg-card text-foreground shadow-sm border border-border/40'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={value === period.value}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}

const financeNav = [
    { label: 'Resumen', path: '/finanzas', icon: LayoutDashboard },
    { label: 'Cuentas', path: '/finanzas/cuentas', icon: Wallet },
    { label: 'Movimientos', path: '/finanzas/movimientos', icon: ArrowUpRight },
    { label: 'Presupuestos', path: '/finanzas/presupuestos', icon: BarChart3 },
    { label: 'Objetivos', path: '/finanzas/objetivos', icon: PiggyBank },
    { label: 'Inversiones', path: '/finanzas/inversiones', icon: TrendingUp },
    { label: 'Tarjetas', path: '/finanzas/tarjetas', icon: CreditCard },
    { label: 'Calendario', path: '/finanzas/calendario', icon: Calendar },
    { label: 'Analytics', path: '/finanzas/analytics', icon: BarChart3 },
];

export function FinancePageFrame({
    title,
    description,
    children,
    actionLabel = 'Nuevo',
    onAction,
    showAction = true,
    status = 'Conectado a tu cuenta',
}: {
    title: string;
    description: string;
    children: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    showAction?: boolean;
    status?: string;
}) {
    const location = useLocation();
    const hideValues = useFinancePreferences((state) => state.hideValues);
    const toggleHideValues = useFinancePreferences((state) => state.toggleHideValues);
    const currency = useFinancePreferences((state) => state.currency);
    const setCurrency = useFinancePreferences((state) => state.setCurrency);

    return (
        <ProGate
            section="finance"
            title="Finanzas personales en Finix PRO"
            description="Tus cuentas, movimientos y objetivos en un espacio privado conectado a tu cuenta Finix."
            features={[
                { title: 'Un solo resumen', desc: 'Patrimonio, liquidez, ahorro y compromisos en una vista clara.' },
                { title: 'Registros reales', desc: 'Cuentas, movimientos, presupuestos y metas guardados en la base de datos.' },
                { title: 'Privacidad por usuario', desc: 'Cada usuario solo accede a sus propios datos financieros.' },
            ]}
        >
            {/* Ambient background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-[700px] h-[400px] bg-emerald-500/4 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-blue-500/3 rounded-full blur-[120px]" />
            </div>

            <div className="min-h-screen bg-background px-4 pb-24 pt-5 text-foreground sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
                <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">

                    {/* Sidebar premium */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-6 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md p-3 shadow-sm overflow-hidden">
                            {/* Header del sidebar */}
                            <div className="px-3 pb-3 pt-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-400">Finanzas</p>
                                </div>
                            </div>

                            <nav className="space-y-0.5" aria-label="Navegacion financiera">
                                {financeNav.map((item) => {
                                    const active =
                                        item.path === '/finanzas'
                                            ? location.pathname === item.path || location.pathname === '/dashboard'
                                            : location.pathname.startsWith(item.path);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                                                active
                                                    ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25'
                                                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent'
                                            )}
                                        >
                                            <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-emerald-400' : 'text-muted-foreground')} />
                                            {item.label}
                                            {active && (
                                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Footer sidebar */}
                            <div className="mt-3 pt-3 border-t border-border/40 px-3">
                                <Link
                                    to="/finanzas/configuracion"
                                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    Ajustes
                                </Link>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0">
                        {/* Header premium */}
                        <header className="mb-8 pb-6 border-b border-border/40">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0 mt-0.5">
                                        <Wallet className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-400">Finanzas Personales</p>
                                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground">{title}</h1>
                                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Status badge */}
                                    <span className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
                                        {status}
                                    </span>

                                    {/* Toggle ocultar valores */}
                                    <button
                                        type="button"
                                        onClick={toggleHideValues}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/50 backdrop-blur-sm"
                                        aria-label={hideValues ? 'Mostrar importes' : 'Ocultar importes'}
                                    >
                                        {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        <span className="hidden sm:inline">{hideValues ? 'Mostrar' : 'Ocultar'}</span>
                                    </button>

                                    {/* Selector moneda */}
                                    <label className="sr-only" htmlFor="finance-currency">Moneda principal</label>
                                    <select
                                        id="finance-currency"
                                        value={currency}
                                        onChange={(event) => setCurrency(event.target.value as FinanceCurrency)}
                                        className="h-10 rounded-xl border border-border/60 bg-card/60 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-sm transition-all"
                                    >
                                        <option value="ARS">ARS</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>

                                    {/* Boton principal */}
                                    {showAction ? (
                                        <Button
                                            onClick={onAction}
                                            className="h-10 px-5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/30"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {actionLabel}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Nav horizontal mobile/tablet */}
                            <nav className="mt-6 -mb-6 flex gap-1 overflow-x-auto pb-px lg:hidden scrollbar-none" aria-label="Navegacion financiera">
                                {financeNav.map((item) => {
                                    const active =
                                        item.path === '/finanzas'
                                            ? location.pathname === item.path || location.pathname === '/dashboard'
                                            : location.pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                'whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-all shrink-0',
                                                active
                                                    ? 'border-emerald-500 text-emerald-400'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    );
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
    return (
        <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
        >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {hidden ? 'Valores ocultos' : 'Ocultar valores'}
        </button>
    );
}

export function NetWorthChart({ points, height = 260 }: { points: FinanceMonthPoint[]; height?: number }) {
    const currency = useFinancePreferences((state) => state.currency);
    return (
        <div style={{ height }} className="w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                    <defs>
                        <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 6" strokeOpacity={0.6} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(value) => formatFinanceAmount(Number(value), currency, true)} width={60} />
                    <Tooltip
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        contentStyle={{
                            background: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            color: 'hsl(var(--popover-foreground))',
                            fontSize: 12,
                            fontWeight: 600,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        }}
                        formatter={(value: number) => [formatFinanceAmount(value, currency), 'Patrimonio']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#netWorthGradient)"
                        activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--primary))' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ProgressBar({ value, max, tone = 'primary' }: { value: number; max: number; tone?: 'primary' | 'warning' | 'danger' | 'muted' }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const toneClass = tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-rose-500' : tone === 'muted' ? 'bg-slate-500' : 'bg-primary';
    const trackClass = tone === 'warning' ? 'bg-amber-500/12' : tone === 'danger' ? 'bg-rose-500/12' : 'bg-secondary';
    return (
        <div className={cn('h-2.5 overflow-hidden rounded-full', trackClass)}>
            <div
                className={cn('h-full rounded-full transition-all duration-500', toneClass)}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

export function SearchField({ value, onChange, placeholder = 'Buscar' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
    return (
        <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="pl-10 h-10 rounded-xl border-border/60 bg-secondary/30 text-sm focus:border-emerald-500/60 focus:bg-secondary/50 transition-all placeholder:text-muted-foreground/60"
            />
        </div>
    );
}

export function ViewAllLink({ to, children = 'Ver todo' }: { to: string; children?: ReactNode }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
            {children}
            <ChevronRight className="h-3.5 w-3.5" />
        </Link>
    );
}

export function SyncButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar
        </button>
    );
}
