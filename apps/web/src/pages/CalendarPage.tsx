import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Loader2,
    Info,
    Flame,
    Clock,
    Globe,
    BarChart3,
    Coins,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    CheckCircle2,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore, isJuanUser } from '@/stores/authStore';
import { ProGate } from '@/components/ProGate';
import { AssetLogoImg } from '@/components/TopGainersCard';

interface CalendarEvent {
    id: string;
    eventType: string;
    country: string;
    countryCode?: string;
    title: string;
    description?: string;
    category: string;
    subcategory?: string;
    importance: string;
    impact?: string;
    impactScore?: number;
    marketImpactScore: number;
    date: string;
    time?: string;
    timezone?: string;
    timestampUtc?: string;
    previousValue?: string;
    forecastValue?: string;
    consensusValue?: string;
    actualValue?: string;
    unit?: string;
    surprise?: number;
    surprisePercent?: number;
    expectedMarketEffect?: string;
    source?: string;
    sourceName?: string;
    sourceUrl?: string;
    affectedAssets?: string[];
    companyName?: string;
    ticker?: string;
}

interface EarningsEvent {
    id: string;
    ticker: string;
    companyName: string;
    logoUrl?: string;
    date: string;
    time?: string;
    dateStatus: string;
    reportTiming?: string;
    epsEstimate?: number;
    revenueEstimate?: number;
    actualEps?: number;
    actualRevenue?: number;
    epsSurprise?: number;
    revenueSurprise?: number;
    marketReaction?: number;
    marketCap?: number;
    earningsImpactScore: number;
}

interface DividendEvent {
    id: string;
    ticker: string;
    companyName: string;
    logoUrl?: string;
    exDate: string;
    paymentDate?: string;
    recordDate?: string;
    declarationDate?: string;
    amount?: number;
    yield?: number;
    frequency?: string;
    marketCap?: number;
    source?: string;
}

interface CalendarDay {
    dayName: string;
    shortDay?: string;
    dayShort?: string;
    date: string;
    isToday: boolean;
    economicEvents: CalendarEvent[];
    earningsEvents: EarningsEvent[];
    dividendEvents: DividendEvent[];
}

interface CalendarWeekData {
    weekRange: { from: string; to: string };
    isProUser: boolean;
    categories: {
        all: number;
        us: number;
        ar: number;
        earnings: number;
        dividends?: number;
    };
    days: CalendarDay[];
}

type CalendarSection = 'GENERAL' | 'BALANCES' | 'DIVIDENDOS';

// Helper: Get monday of a week offset from today
function getWeekStartForOffset(offsetWeeks: number): string {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

function formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(dt);
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isPro = Boolean(
        (user as any)?.plan === 'PRO' ||
        (user as any)?.accountType === 'PRO' ||
        (user as any)?.role === 'ADMIN' ||
        (user as any)?.isPro ||
        (user as any)?.subscriptionTier === 'pro' ||
        isJuanUser(user)
    );

    // 3 Subdivisiones Principales solicitadas: General, Balances, Dividendos
    const [activeSection, setActiveSection] = useState<CalendarSection>('GENERAL');
    // Filtros de categoría para la sección General
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    // Week navigation offset (0 = current week, 1 = next, -1 = previous)
    const [weekOffset, setWeekOffset] = useState<number>(0);

    const [calendarData, setCalendarData] = useState<CalendarWeekData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    // Detección automática del timezone local del usuario
    const userTimezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires';
        } catch {
            return 'America/Argentina/Buenos_Aires';
        }
    }, []);

    // Abreviación del timezone para el usuario
    const userTimezoneShort = useMemo(() => {
        if (userTimezone.includes('Argentina') || userTimezone.includes('Cordoba') || userTimezone.includes('Buenos_Aires')) return 'ART';
        if (userTimezone.includes('New_York') || userTimezone.includes('Eastern')) return 'ET';
        if (userTimezone.includes('London')) return 'BST/GMT';
        if (userTimezone.includes('Madrid') || userTimezone.includes('Paris')) return 'CET';
        return userTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
    }, [userTimezone]);

    const loadCalendar = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const queryParams = new URLSearchParams();
            // La semana elegida siempre se envía al servidor. Así los balances
            // publicados siguen disponibles al volver a semanas anteriores.
            queryParams.set('weekStart', getWeekStartForOffset(weekOffset));
            if (activeSection === 'BALANCES') {
                queryParams.set('category', 'EARNINGS');
            } else if (activeSection === 'DIVIDENDOS') {
                queryParams.set('category', 'DIVIDEND');
            } else {
                if (activeCategory === 'US' || activeCategory === 'AR') {
                    queryParams.set('category', activeCategory);
                } else {
                    queryParams.set('category', 'ALL');
                }
            }

            const res = await apiFetch(`/calendar/week?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Error loading calendar');
            const data = await res.json();
            setCalendarData(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCalendar();
    }, [activeSection, activeCategory, weekOffset]);

    if (!isPro) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    title="Sección exclusiva PRO"
                    description="Accedé al calendario completo con eventos macroeconómicos, balances corporativos y dividendos del S&P 500 en tiempo real con datos oficiales de TradingView."
                    buttonText="Activar PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    // Formateador de fecha/hora al timezone local
    const formatLocalTime = (dateStr: string, timeStr?: string, timestampUtc?: string) => {
        try {
            let dt: Date;
            if (timestampUtc) {
                dt = new Date(timestampUtc);
            } else {
                dt = new Date(`${dateStr}T${timeStr || '14:00'}:00Z`);
            }

            if (isNaN(dt.getTime())) return timeStr || 'Durante el día';

            return new Intl.DateTimeFormat('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: userTimezone,
            }).format(dt);
        } catch {
            return timeStr || 'Durante el día';
        }
    };

    // Formateador de facturación / beneficios (soporta números en crudo de TradingView)
    const formatRevenue = (rev?: number | string | null) => {
        if (rev == null) return 'N/D';
        const num = typeof rev === 'string' ? parseFloat(rev) : rev;
        if (isNaN(num)) return 'N/D';
        if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    };

    // Formateador de capitalización de mercado
    const formatMarketCap = (mc?: number | string | null) => {
        if (mc == null) return null;
        const num = typeof mc === 'string' ? parseFloat(mc) : mc;
        if (isNaN(num) || num <= 0) return null;
        if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        return `$${num.toFixed(0)}`;
    };

    // Estilo de badges de impacto
    const getImpactBadge = (score?: number, imp?: string) => {
        const s = score ?? 50;
        if (s >= 90 || imp === 'CRITICAL') {
            return {
                label: 'CRÍTICO',
                className: 'bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-black',
                dotColor: 'bg-purple-500',
                isCritical: true,
            };
        }
        if (s >= 70 || imp === 'HIGH') {
            return {
                label: 'ALTO',
                className: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-extrabold',
                dotColor: 'bg-rose-500',
                isCritical: false,
            };
        }
        if (s >= 40 || imp === 'MEDIUM') {
            return {
                label: 'MEDIO',
                className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold',
                dotColor: 'bg-amber-500',
                isCritical: false,
            };
        }
        return {
            label: 'BAJO',
            className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20 font-medium',
            dotColor: 'bg-slate-400',
            isCritical: false,
        };
    };

    // Filtrar eventos de economía por categorías secundarias
    const filterEventByCategory = (e: CalendarEvent) => {
        if (activeCategory === 'ALL' || activeCategory === 'US' || activeCategory === 'AR') return true;
        if (activeCategory === 'RATES') return e.category === 'MONETARY_POLICY' || e.category === 'INTEREST_RATES' || e.category === 'CENTRAL_BANK';
        if (activeCategory === 'INFLATION') return e.category === 'INFLATION';
        if (activeCategory === 'EMPLOYMENT') return e.category === 'EMPLOYMENT';
        if (activeCategory === 'GDP') return e.category === 'GDP' || e.category === 'ACTIVITY';
        if (activeCategory === 'TRADE') return e.category === 'TRADE';
        return e.category === activeCategory;
    };

    // Totalizadores por sección para mostrar badges
    const totalEconomic = (calendarData?.categories?.us ?? 0) + (calendarData?.categories?.ar ?? 0);
    const totalEarnings = calendarData?.categories?.earnings ?? 0;
    const totalDividends = calendarData?.categories?.dividends ?? 0;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header / Hero Section */}
            <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-30">
                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground">
                                    Calendario de Mercado
                                </h1>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2 flex-wrap font-medium">
                                <span>Seguimiento en tiempo real de macroeconomía, balances y dividendos del S&P 500.</span>
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm text-foreground bg-muted/80 px-2.5 py-1 rounded-lg border border-border/60 font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> Hora local: {userTimezoneShort}
                                </span>
                            </p>
                        </div>

                        {/* Indicador de Semana Activa con navegación */}
                        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-2xl border border-border/50 self-start md:self-auto shadow-sm">
                            <button
                                onClick={() => setWeekOffset(w => Math.max(-4, w - 1))}
                                disabled={weekOffset <= -4}
                                className="p-1 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Semana anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 px-1">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs sm:text-sm font-black text-foreground">
                                    {weekOffset === 0 ? 'Semana Actual' : weekOffset > 0 ? `+${weekOffset} sem.` : `${weekOffset} sem.`}
                                </span>
                            </div>
                            {calendarData?.weekRange && (
                                <span className="text-xs font-mono font-bold text-muted-foreground border-l border-border/60 pl-2">
                                    {formatDateLabel(calendarData.weekRange.from)} al {formatDateLabel(calendarData.weekRange.to)}
                                </span>
                            )}
                            <button
                                onClick={() => setWeekOffset(w => Math.min(4, w + 1))}
                                disabled={weekOffset >= 4}
                                className="p-1 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Semana siguiente"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* 3 Subdivisiones Principales: General, Balances, Dividendos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-6 p-1.5 bg-secondary/40 backdrop-blur-md rounded-2xl border border-border/60">
                        {/* 1. Sección General */}
                        <button
                            onClick={() => setActiveSection('GENERAL')}
                            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-heading font-extrabold text-sm sm:text-base transition-all ${activeSection === 'GENERAL'
                                ? 'bg-card text-foreground shadow-md shadow-primary/10 border border-primary/40'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                        >
                            <Globe className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === 'GENERAL' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>General (Economía)</span>
                            {calendarData && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-primary/15 text-primary border border-primary/25">
                                    {totalEconomic}
                                </span>
                            )}
                        </button>

                        {/* 2. Sección Balances */}
                        <button
                            onClick={() => setActiveSection('BALANCES')}
                            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-heading font-extrabold text-sm sm:text-base transition-all ${activeSection === 'BALANCES'
                                ? 'bg-card text-foreground shadow-md shadow-amber-500/10 border border-amber-500/40'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                        >
                            <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === 'BALANCES' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            <span>Balances S&P 500</span>
                            {calendarData && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                    {totalEarnings}
                                </span>
                            )}
                        </button>

                        {/* 3. Sección Dividendos */}
                        <button
                            onClick={() => setActiveSection('DIVIDENDOS')}
                            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-heading font-extrabold text-sm sm:text-base transition-all ${activeSection === 'DIVIDENDOS'
                                ? 'bg-card text-foreground shadow-md shadow-emerald-500/10 border border-emerald-500/40'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                        >
                            <Coins className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === 'DIVIDENDOS' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                            <span>Dividendos S&P 500</span>
                            {calendarData && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                    {totalDividends}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Sub-filtros dinámicos según la sección activa */}
                    {activeSection === 'GENERAL' && (
                        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar text-xs sm:text-sm font-bold">
                            {[
                                { key: 'ALL', label: 'Todos los indicadores' },
                                { key: 'US', label: 'Estados Unidos 🇺🇸' },
                                { key: 'AR', label: 'Argentina 🇦🇷' },
                                { key: 'RATES', label: 'Tasas & Fed 🏛️' },
                                { key: 'INFLATION', label: 'Inflación / IPC 📈' },
                                { key: 'EMPLOYMENT', label: 'Empleo & Nóminas 💼' },
                                { key: 'GDP', label: 'PIB & Actividad 🏭' },
                                { key: 'TRADE', label: 'Comercio Exterior 🚢' },
                            ].map((cat) => (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveCategory(cat.key)}
                                    className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all border ${activeCategory === cat.key
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm font-black'
                                        : 'bg-card/70 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-semibold'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 space-y-8">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-semibold">Cargando eventos de mercado de la semana...</p>
                    </div>
                ) : isError || !calendarData ? (
                    <div className="py-20 text-center rounded-2xl border border-dashed border-border/60 p-8">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-base font-bold text-foreground">No se pudieron cargar los eventos de la semana</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Por favor revisá tu conexión e intentá de nuevo.
                        </p>
                    </div>
                ) : (
                    calendarData.days.map((day) => {
                        const dayEconomic = activeSection === 'GENERAL'
                            ? day.economicEvents.filter(e => filterEventByCategory(e))
                            : [];
                        const dayEarnings = activeSection === 'BALANCES'
                            ? day.earningsEvents
                            : [];
                        const dayDividends = activeSection === 'DIVIDENDOS'
                            ? (day.dividendEvents || [])
                            : [];

                        const hasEventsInDay = dayEconomic.length > 0 || dayEarnings.length > 0 || dayDividends.length > 0;

                        if (!hasEventsInDay) return null;

                        return (
                            <div key={day.date} className="space-y-4">
                                {/* Day Header Bar */}
                                <div className="flex items-center gap-3 pb-2.5 border-b border-border/40">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl sm:text-3xl font-heading font-black text-foreground">
                                            {day.dayName}
                                        </span>
                                        <span className="text-sm sm:text-base font-bold text-muted-foreground font-mono">
                                            {day.date}
                                        </span>
                                    </div>
                                    {day.isToday && (
                                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Hoy
                                        </span>
                                    )}
                                </div>

                                {/* Events List for Day */}
                                {activeSection === 'GENERAL' && (
                                    <div className="space-y-4">
                                        {dayEconomic.map((evt) => {
                                            const impactBadge = getImpactBadge(evt.impactScore ?? evt.marketImpactScore, evt.importance);
                                            const flag = evt.country === 'AR' ? '🇦🇷' : evt.country === 'US' ? '🇺🇸' : '🌐';
                                            const localTime = formatLocalTime(evt.date, evt.time, evt.timestampUtc);
                                            const surprisePositive = (evt.surprise ?? 0) > 0;

                                            return (
                                                <div
                                                    key={evt.id}
                                                    className="p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/70 hover:bg-card/95 transition-all space-y-4 shadow-sm group"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <span className="text-xl">{flag}</span>
                                                            <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg border font-black flex items-center gap-1.5 ${impactBadge.className}`}>
                                                                {impactBadge.isCritical && <Flame className="w-3.5 h-3.5 text-purple-500 animate-pulse" />}
                                                                Impacto {impactBadge.label}
                                                            </span>
                                                            <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 font-mono bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
                                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {localTime}
                                                            </span>
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                {evt.country === 'AR' ? 'Argentina' : 'Estados Unidos'}
                                                            </span>
                                                        </div>
                                                        {evt.source && (
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                Fuente: {evt.source}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-base sm:text-xl font-bold text-foreground">
                                                            {evt.title}
                                                        </h3>
                                                        {evt.description && (
                                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                                                                {evt.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Metrics Data Bar */}
                                                    {(evt.actualValue != null || evt.consensusValue != null || evt.previousValue != null) && (
                                                        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center gap-4 sm:gap-8 text-sm font-mono">
                                                            {evt.actualValue != null && (
                                                                <div>
                                                                    <span className="text-muted-foreground font-sans">Actual: </span>
                                                                    <span className="font-black text-foreground text-base">{evt.actualValue}{evt.unit ? ` ${evt.unit}` : ''}</span>
                                                                </div>
                                                            )}
                                                            {evt.consensusValue != null && (
                                                                <div>
                                                                    <span className="text-muted-foreground font-sans">Estimado: </span>
                                                                    <span className="font-bold text-foreground">{evt.consensusValue}{evt.unit ? ` ${evt.unit}` : ''}</span>
                                                                </div>
                                                            )}
                                                            {evt.previousValue != null && (
                                                                <div>
                                                                    <span className="text-muted-foreground font-sans">Previo: </span>
                                                                    <span className="font-semibold text-muted-foreground">{evt.previousValue}{evt.unit ? ` ${evt.unit}` : ''}</span>
                                                                </div>
                                                            )}
                                                            {evt.surprise != null && (
                                                                <div>
                                                                    <span className="text-muted-foreground font-sans">Sorpresa: </span>
                                                                    <span className={`font-black ${surprisePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {surprisePositive ? '+' : ''}{evt.surprise}{evt.unit ? ` ${evt.unit}` : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Affected assets */}
                                                    {evt.affectedAssets && evt.affectedAssets.length > 0 && (
                                                        <div className="flex items-center gap-2 flex-wrap pt-1">
                                                            <span className="text-xs text-muted-foreground font-semibold">Activos afectados:</span>
                                                            {evt.affectedAssets.map((asset, aIdx) => (
                                                                <span key={aIdx} className="px-2 py-0.5 rounded-md bg-secondary text-xs font-black text-foreground border border-border/60">
                                                                    {asset}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Contextual Market Effect */}
                                                    {evt.expectedMarketEffect && (
                                                        <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/40 border border-border/40 text-sm text-foreground/90 flex items-start gap-3">
                                                            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                            <p className="leading-relaxed font-medium">{evt.expectedMarketEffect}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 2. S&P 500 Earnings Events (Balances Section - Cuadrados 3 por fila) */}
                                {activeSection === 'BALANCES' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                        {dayEarnings.map((earn) => {
                                            const timingLabel = earn.reportTiming === 'AMC'
                                                ? 'Después del cierre'
                                                : earn.reportTiming === 'BMO'
                                                    ? 'Antes de la apertura'
                                                    : 'Durante la rueda';
                                            const hasReportedResult = earn.actualEps != null || earn.actualRevenue != null;
                                            const epsWon = earn.epsSurprise != null && earn.epsSurprise >= 0;
                                            const revenueWon = earn.revenueSurprise != null && earn.revenueSurprise >= 0;
                                            const reportedMetrics = [earn.epsSurprise, earn.revenueSurprise].filter((value) => value != null);
                                            const positiveMetrics = reportedMetrics.filter((value) => Number(value) >= 0).length;
                                            const resultWon = reportedMetrics.length > 0 && positiveMetrics === reportedMetrics.length;
                                            const resultMixed = reportedMetrics.length > 0 && positiveMetrics > 0 && !resultWon;
                                            const marketUp = earn.marketReaction != null && earn.marketReaction >= 0;

                                            return (
                                                <div
                                                    key={earn.id}
                                                    className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card/80 hover:bg-card transition-all flex flex-col justify-between space-y-4 shadow-sm group hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 min-h-[250px]"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <span className="text-[11px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                                                                📊 S&P 500
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                                                                    {timingLabel}
                                                                </span>
                                                                {hasReportedResult ? (
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${resultWon ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : resultMixed ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                                                                        Publicado
                                                                    </span>
                                                                ) : earn.dateStatus === 'ESTIMATED' && (
                                                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                                                        Est.
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Company & Ticker */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center ring-1 ring-border/80 bg-card p-1 shadow-xs">
                                                                <AssetLogoImg
                                                                    ticker={earn.ticker}
                                                                    src={earn.logoUrl}
                                                                    name={earn.companyName}
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="text-xl font-black text-foreground tracking-tight group-hover:text-amber-500 transition-colors">
                                                                        {earn.ticker}
                                                                    </span>
                                                                    {earn.marketCap && (
                                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                                            {formatMarketCap(earn.marketCap) ? `Cap: ${formatMarketCap(earn.marketCap)}` : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-semibold text-muted-foreground truncate" title={earn.companyName}>
                                                                    {earn.companyName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-border/50 space-y-2.5 text-xs">
                                                        {hasReportedResult ? (
                                                            <>
                                                                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${resultWon ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : resultMixed ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                                    {resultWon ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                                                                    <span className="font-bold">{resultWon ? 'Balance victorioso: superó las estimaciones.' : resultMixed ? 'Balance mixto: hubo métricas a favor y en contra.' : 'Balance por debajo del consenso.'}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2.5 font-mono">
                                                                    <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40">
                                                                        <div className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-wider">Ganancias (EPS)</div>
                                                                        <div className="mt-1 flex items-baseline justify-between gap-1"><span className="text-muted-foreground">Est. {earn.epsEstimate != null ? `$${earn.epsEstimate.toFixed(2)}` : 'N/D'}</span><span className={`font-black ${epsWon ? 'text-emerald-500' : 'text-rose-500'}`}>Real {earn.actualEps != null ? `$${earn.actualEps.toFixed(2)}` : 'N/D'}</span></div>
                                                                        <div className={`mt-1 font-bold ${epsWon ? 'text-emerald-500' : 'text-rose-500'}`}>{earn.epsSurprise != null ? `${epsWon ? '+' : ''}${earn.epsSurprise.toFixed(1)}% vs. consenso` : 'Sin comparación'}</div>
                                                                    </div>
                                                                    <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40">
                                                                        <div className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-wider">Facturación</div>
                                                                        <div className="mt-1 flex items-baseline justify-between gap-1"><span className="text-muted-foreground">Est. {formatRevenue(earn.revenueEstimate)}</span><span className={`font-black ${revenueWon ? 'text-emerald-500' : 'text-rose-500'}`}>Real {formatRevenue(earn.actualRevenue)}</span></div>
                                                                        <div className={`mt-1 font-bold ${revenueWon ? 'text-emerald-500' : 'text-rose-500'}`}>{earn.revenueSurprise != null ? `${revenueWon ? '+' : ''}${earn.revenueSurprise.toFixed(1)}% vs. consenso` : 'Sin comparación'}</div>
                                                                    </div>
                                                                </div>
                                                                {earn.marketReaction != null && (
                                                                    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${marketUp ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'}`}>
                                                                        <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">{marketUp ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />} Reacción del mercado</span>
                                                                        <span className={`font-black font-mono ${marketUp ? 'text-emerald-500' : 'text-rose-500'}`}>{marketUp ? '+' : ''}{earn.marketReaction.toFixed(2)}% · {marketUp ? 'recibido positivamente' : 'reacción negativa'}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2.5 font-mono">
                                                                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40"><div className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-wider">EPS estimado</div><div className="mt-1 text-sm sm:text-base font-black text-amber-500">{earn.epsEstimate != null ? `$${earn.epsEstimate.toFixed(2)}` : 'N/D'}</div></div>
                                                                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40"><div className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-wider">Facturación est.</div><div className="mt-1 text-sm sm:text-base font-black text-foreground">{formatRevenue(earn.revenueEstimate)}</div></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 3. S&P 500 Dividend Events — TradingView Style */}
                                {activeSection === 'DIVIDENDOS' && (
                                    <div className="space-y-2">
                                        {dayDividends.map((div) => (
                                            <div
                                                key={div.id}
                                                className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-2xl border border-border/50 bg-card/70 hover:bg-card hover:border-emerald-500/40 transition-all group shadow-sm"
                                            >
                                                {/* Logo */}
                                                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ring-1 ring-border/60 bg-card p-1">
                                                    <AssetLogoImg ticker={div.ticker} src={div.logoUrl} name={div.companyName} />
                                                </div>

                                                {/* Ticker + Company */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-black text-foreground group-hover:text-emerald-400 transition-colors tracking-tight">
                                                            {div.ticker}
                                                        </span>
                                                        {div.frequency && (
                                                            <span className="text-[10px] font-bold text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded border border-border/40 hidden sm:inline-block">
                                                                {div.frequency}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium truncate">{div.companyName}</p>
                                                </div>

                                                {/* Ex-Date — most important field like TradingView */}
                                                <div className="text-center flex-shrink-0 hidden sm:block">
                                                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Ex-Date</div>
                                                    <div className="text-sm font-black text-foreground font-mono">{formatDateLabel(div.exDate)}</div>
                                                </div>

                                                {/* Payment Date */}
                                                <div className="text-center flex-shrink-0 hidden md:block">
                                                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                        <CalendarIcon className="w-2.5 h-2.5" /> Pago
                                                    </div>
                                                    <div className="text-sm font-bold text-emerald-400 font-mono">
                                                        {div.paymentDate ? formatDateLabel(div.paymentDate) : '—'}
                                                    </div>
                                                </div>

                                                {/* Amount per share */}
                                                <div className="text-center flex-shrink-0">
                                                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                        <DollarSign className="w-2.5 h-2.5" /> Por acción
                                                    </div>
                                                    <div className="text-sm font-black text-foreground font-mono">
                                                        {div.amount != null ? `$${div.amount.toFixed(4).replace(/\.?0+$/, '')}` : '—'}
                                                    </div>
                                                </div>

                                                {/* Yield — highlighted like TradingView */}
                                                <div className="flex-shrink-0">
                                                    {div.yield != null ? (
                                                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-1.5">
                                                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span className="text-sm font-black text-emerald-400">{div.yield.toFixed(2)}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
