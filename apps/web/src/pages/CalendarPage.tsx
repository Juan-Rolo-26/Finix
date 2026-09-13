import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Lock,
    Sparkles,
    Filter,
    Loader2,
    Info,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AssetLogoImg } from '@/components/TopGainersCard';

interface EconomicEvent {
    id: string;
    eventType: 'ECONOMIC';
    country: string;
    currency?: string;
    title: string;
    description?: string;
    category: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    marketImpactScore: number;
    date: string;
    time?: string;
    timezone: string;
    previousValue?: string;
    consensusValue?: string;
    actualValue?: string;
    surprise?: number;
    surprisePercent?: number;
    expectedMarketEffect?: string;
    affectedAssets?: string[];
    source?: string;
}

interface EarningsEvent {
    id: string;
    eventType?: 'EARNINGS';
    ticker: string;
    companyName: string;
    logoUrl?: string;
    date: string;
    time?: string;
    timezone: string;
    dateStatus: 'CONFIRMED' | 'ESTIMATED';
    reportTiming?: 'BMO' | 'AMC' | 'DMH';
    epsEstimate?: number;
    revenueEstimate?: number;
    actualEps?: number;
    actualRevenue?: number;
    epsSurprise?: number;
    revenueSurprise?: number;
    marketCap?: number;
    earningsImpactScore: number;
    source?: string;
}

interface CalendarDay {
    date: string;
    dayName: string;
    shortDay: string;
    isToday: boolean;
    economicEvents: EconomicEvent[];
    earningsEvents: EarningsEvent[];
}

interface CalendarWeekData {
    weekRange: { from: string; to: string };
    isProUser: boolean;
    categories: {
        all: number;
        us: number;
        ar: number;
        earnings: number;
    };
    days: CalendarDay[];
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isPro = Boolean(
        (user as any)?.plan === 'PRO' ||
        (user as any)?.accountType === 'PRO' ||
        (user as any)?.role === 'ADMIN' ||
        (user as any)?.isPro ||
        (user as any)?.subscriptionTier === 'pro'
    );

    const [activeCategory, setActiveCategory] = useState<'ALL' | 'US' | 'AR' | 'EARNINGS'>('ALL');
    const [importanceFilter, setImportanceFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
    const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = Esta semana, 1 = Próxima semana

    const [calendarData, setCalendarData] = useState<CalendarWeekData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    // Calcular inicio de semana según offset
    const getTargetWeekStart = (offset: number): string => {
        const d = new Date();
        const day = d.getDay();
        let diff = day === 0 ? 1 : day === 6 ? 2 : (1 - day);
        d.setDate(d.getDate() + diff + offset * 7);
        return d.toISOString().substring(0, 10);
    };

    const loadCalendar = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const weekStart = getTargetWeekStart(weekOffset);
            const queryParams = new URLSearchParams({
                weekStart,
                category: activeCategory,
            });
            if (importanceFilter !== 'ALL') {
                queryParams.set('importance', importanceFilter);
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
    }, [activeCategory, importanceFilter, weekOffset]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header / Hero Section */}
            <div className="border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
                                    Calendario
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25">
                                    Curado
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Los eventos que pueden mover los mercados. No mostramos todo, mostramos lo que importa.
                            </p>
                        </div>

                        {/* Selector de Semana */}
                        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border/40 self-start md:self-auto">
                            <button
                                onClick={() => setWeekOffset(0)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${weekOffset === 0
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Esta semana
                            </button>
                            <button
                                onClick={() => setWeekOffset(1)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${weekOffset === 1
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Próxima semana
                            </button>
                        </div>
                    </div>

                    {/* Categorías Principales */}
                    <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { key: 'ALL', label: 'Todos' },
                            { key: 'US', label: '🇺🇸 Estados Unidos' },
                            { key: 'AR', label: '🇦🇷 Argentina' },
                            { key: 'EARNINGS', label: '📊 Resultados' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key as any)}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat.key
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                                    : 'bg-card/70 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}

                        <div className="h-5 w-[1px] bg-border/60 mx-1 flex-shrink-0" />

                        {/* Filtro de Importancia */}
                        <button
                            onClick={() => setImportanceFilter(prev => prev === 'ALL' ? 'HIGH' : prev === 'HIGH' ? 'MEDIUM' : 'ALL')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${importanceFilter !== 'ALL'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-card/40 border-border/40 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {importanceFilter === 'ALL' ? 'Impacto: Todos' : importanceFilter === 'HIGH' ? 'Impacto Alto' : 'Impacto Medio'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
                {/* Paywall Banner for Free Users */}
                {!isPro && (
                    <div
                        className="p-5 sm:p-6 rounded-2xl border border-primary/30 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        style={{
                            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.08) 100%)',
                            boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary flex-shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                    Desbloqueá el Calendario Completo
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground">
                                        PRO
                                    </span>
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                                    Accedé a estimaciones de consenso, sorpresas (+/- pp), impacto sectorial y activos afectados por cada evento económico y balance corporativo.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/pro')}
                            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 flex-shrink-0"
                        >
                            <Sparkles className="w-4 h-4" />
                            Ver plan Pro →
                        </button>
                    </div>
                )}

                {/* Days Schedule */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-semibold">Cargando eventos de la semana...</p>
                    </div>
                ) : isError || !calendarData || calendarData.days.every(d => d.economicEvents.length === 0 && d.earningsEvents.length === 0) ? (
                    <div className="py-20 text-center rounded-2xl border border-dashed border-border/60 p-8">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-base font-bold text-foreground">No hay eventos para los filtros seleccionados</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Probá seleccionando "Todos" o cambiando a la siguiente semana.
                        </p>
                    </div>
                ) : (
                    calendarData.days.map((day) => {
                        const hasEvents = day.economicEvents.length > 0 || day.earningsEvents.length > 0;
                        if (!hasEvents) return null;

                        return (
                            <div key={day.date} className="space-y-3">
                                {/* Day Header Bar */}
                                <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg sm:text-xl font-heading font-extrabold text-foreground">
                                            {day.dayName}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {day.date}
                                        </span>
                                    </div>
                                    {day.isToday && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Hoy
                                        </span>
                                    )}
                                </div>

                                {/* Events List for Day */}
                                <div className="space-y-3">
                                    {/* 1. Economic Events */}
                                    {day.economicEvents.map((evt) => {
                                        const isHigh = evt.importance === 'HIGH';
                                        const flag = evt.country === 'AR' ? '🇦🇷' : '🇺🇸';
                                        const surprisePositive = (evt.surprise ?? 0) > 0;

                                        return (
                                            <div
                                                key={evt.id}
                                                className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-base">{flag}</span>
                                                        <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border ${isHigh
                                                            ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                                                            : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                                            }`}>
                                                            Impacto {evt.importance === 'HIGH' ? 'Alto' : 'Medio'}
                                                        </span>
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            {evt.time || 'Durante el día'}
                                                        </span>
                                                        {evt.category && (
                                                            <span className="text-[10px] font-semibold text-muted-foreground/70 bg-secondary/40 px-1.5 py-0.5 rounded">
                                                                {evt.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {evt.source && (
                                                        <span className="text-[11px] text-muted-foreground/80 font-medium self-start sm:self-auto">
                                                            Fuente: {evt.source}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-sm sm:text-base font-bold text-foreground">
                                                        {evt.title}
                                                    </h4>
                                                    {evt.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                            {evt.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Macro Metrics Bar (Free vs Pro) */}
                                                {isPro ? (
                                                    <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                                                        {evt.previousValue && (
                                                            <div>
                                                                <span className="text-muted-foreground">Anterior: </span>
                                                                <span className="font-bold text-foreground">{evt.previousValue}</span>
                                                            </div>
                                                        )}
                                                        {evt.consensusValue && (
                                                            <div>
                                                                <span className="text-muted-foreground">Consenso: </span>
                                                                <span className="font-bold text-foreground">{evt.consensusValue}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-muted-foreground">Actual: </span>
                                                            <span className="font-bold text-foreground">
                                                                {evt.actualValue ? evt.actualValue : '—'}
                                                            </span>
                                                        </div>
                                                        {evt.surprise != null && (
                                                            <div>
                                                                <span className="text-muted-foreground">Sorpresa: </span>
                                                                <span className={`font-black ${surprisePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {surprisePositive ? '+' : ''}{evt.surprise} pp
                                                                </span>
                                                            </div>
                                                        )}
                                                        {evt.affectedAssets && evt.affectedAssets.length > 0 && (
                                                            <div className="flex items-center gap-1.5 ml-auto">
                                                                <span className="text-muted-foreground text-[11px]">Activos:</span>
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {evt.affectedAssets.map((asset, aIdx) => (
                                                                        <span key={aIdx} className="px-1.5 py-0.5 rounded bg-secondary/80 text-[10.5px] font-bold text-foreground">
                                                                            {asset}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Lock className="w-3 h-3 text-primary" />
                                                            Consenso, sorpresa y activos afectados exclusivos para PRO
                                                        </span>
                                                        <button
                                                            onClick={() => navigate('/pro')}
                                                            className="text-primary font-bold hover:underline"
                                                        >
                                                            Ver Pro →
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Contextual Market Effect (Pro only) */}
                                                {isPro && evt.expectedMarketEffect && (
                                                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/30 text-xs text-muted-foreground flex items-start gap-2">
                                                        <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                                        <p className="leading-relaxed">{evt.expectedMarketEffect}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* 2. Earnings Events */}
                                    {day.earningsEvents.map((earn) => {
                                        const timingLabel = earn.reportTiming === 'AMC'
                                            ? 'Después del cierre'
                                            : earn.reportTiming === 'BMO'
                                                ? 'Antes de la apertura'
                                                : 'Durante la rueda';

                                        return (
                                            <div
                                                key={earn.id}
                                                className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                            📊 RESULTADOS
                                                        </span>
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            {timingLabel}
                                                        </span>
                                                        {earn.dateStatus === 'ESTIMATED' && (
                                                            <span className="text-[9.5px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                                                Fecha estimada
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Company & Ticker */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ring-1 ring-border">
                                                        <AssetLogoImg
                                                            ticker={earn.ticker}
                                                            src={earn.logoUrl}
                                                            name={earn.companyName}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm sm:text-base font-bold text-foreground">
                                                                {earn.ticker}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {earn.companyName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial Estimates Bar */}
                                                {isPro ? (
                                                    <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                                                        {earn.epsEstimate != null && (
                                                            <div>
                                                                <span className="text-muted-foreground">EPS Estimado: </span>
                                                                <span className="font-bold text-foreground">${earn.epsEstimate.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {earn.revenueEstimate != null && (
                                                            <div>
                                                                <span className="text-muted-foreground">Revenue Estimado: </span>
                                                                <span className="font-bold text-foreground">${earn.revenueEstimate}B</span>
                                                            </div>
                                                        )}
                                                        {earn.actualEps != null && (
                                                            <div>
                                                                <span className="text-muted-foreground">EPS Actual: </span>
                                                                <span className="font-bold text-foreground">${earn.actualEps.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {earn.epsSurprise != null && (
                                                            <div>
                                                                <span className="text-muted-foreground">Sorpresa EPS: </span>
                                                                <span className={`font-black ${earn.epsSurprise >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {earn.epsSurprise >= 0 ? '+' : ''}{earn.epsSurprise}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Lock className="w-3 h-3 text-primary" />
                                                            EPS y Revenue estimado disponibles con Finix PRO
                                                        </span>
                                                        <button
                                                            onClick={() => navigate('/pro')}
                                                            className="text-primary font-bold hover:underline"
                                                        >
                                                            Ver Pro →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
