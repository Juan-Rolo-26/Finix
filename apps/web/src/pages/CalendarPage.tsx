import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ListFilter,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore, isProUser } from '@/stores/authStore';
import { ProGate } from '@/components/ProGate';
import { AssetLogoImg } from '@/components/TopGainersCard';
import { MarketHeader, MarketChange } from '@/components/markets/MarketPrimitives';
import './calendar.css';

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
    economicData?: {
        status: 'READY' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
        httpStatus?: number;
        excludedLegacyEvents?: number;
    };
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
type EarningsSort = 'RELEVANCIA' | 'VICTORIOSOS' | 'DESVICTORIOSOS' | 'MIXTOS' | 'PENDIENTES';
type EarningsOutcome = 'VICTORIOSO' | 'DESVICTORIOSO' | 'MIXTO' | 'INFORMADO' | 'PENDIENTE';

function getEarningsOutcome(earn: EarningsEvent): EarningsOutcome {
    const surprises = [earn.epsSurprise, earn.revenueSurprise].filter(
        (value): value is number => value != null,
    );
    if (surprises.length === 0) {
        return earn.actualEps != null || earn.actualRevenue != null ? 'INFORMADO' : 'PENDIENTE';
    }
    if (surprises.every((value) => value >= 0)) return 'VICTORIOSO';
    if (surprises.every((value) => value < 0)) return 'DESVICTORIOSO';
    return 'MIXTO';
}

function sortEarnings(events: EarningsEvent[], sort: EarningsSort): EarningsEvent[] {
    const outcomeOrder: Record<EarningsOutcome, number> = {
        VICTORIOSO: 0,
        DESVICTORIOSO: 1,
        MIXTO: 2,
        INFORMADO: 3,
        PENDIENTE: 4,
    };
    const selectedOutcome =
        sort === 'VICTORIOSOS'
            ? 'VICTORIOSO'
            : sort === 'DESVICTORIOSOS'
              ? 'DESVICTORIOSO'
              : sort === 'MIXTOS'
                ? 'MIXTO'
                : sort === 'PENDIENTES'
                  ? 'PENDIENTE'
                  : undefined;

    return [...events].sort((a, b) => {
        if (selectedOutcome) {
            const aSelected = getEarningsOutcome(a) === selectedOutcome;
            const bSelected = getEarningsOutcome(b) === selectedOutcome;
            if (aSelected !== bSelected) return aSelected ? -1 : 1;
        } else if (sort === 'RELEVANCIA') {
            const impactDifference = (b.earningsImpactScore ?? 0) - (a.earningsImpactScore ?? 0);
            if (impactDifference !== 0) return impactDifference;
        }

        const outcomeDifference =
            outcomeOrder[getEarningsOutcome(a)] - outcomeOrder[getEarningsOutcome(b)];
        return outcomeDifference !== 0 ? outcomeDifference : a.ticker.localeCompare(b.ticker);
    });
}

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
    const isPro = isProUser(user);

    // 3 Subdivisiones Principales solicitadas: General, Balances, Dividendos
    const [activeSection, setActiveSection] = useState<CalendarSection>('GENERAL');
    const [earningsSort, setEarningsSort] = useState<EarningsSort>('RELEVANCIA');
    // Filtros de categoría para la sección General
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    // Week navigation offset (0 = current week, 1 = next, -1 = previous)
    const [weekOffset, setWeekOffset] = useState<number>(0);

    const [calendarData, setCalendarData] = useState<CalendarWeekData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const activeRequest = useRef<AbortController | null>(null);

    // Detección automática del timezone local del usuario
    const userTimezone = useMemo(() => {
        try {
            return (
                Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires'
            );
        } catch {
            return 'America/Argentina/Buenos_Aires';
        }
    }, []);

    // Abreviación del timezone para el usuario
    const userTimezoneShort = useMemo(() => {
        if (
            userTimezone.includes('Argentina') ||
            userTimezone.includes('Cordoba') ||
            userTimezone.includes('Buenos_Aires')
        )
            return 'ART';
        if (userTimezone.includes('New_York') || userTimezone.includes('Eastern')) return 'ET';
        if (userTimezone.includes('London')) return 'BST/GMT';
        if (userTimezone.includes('Madrid') || userTimezone.includes('Paris')) return 'CET';
        return userTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
    }, [userTimezone]);

    const loadCalendar = useCallback(async () => {
        activeRequest.current?.abort();
        const request = new AbortController();
        activeRequest.current = request;
        setIsLoading(true);
        setIsError(false);
        try {
            // One complete week keeps all sections and their counters consistent.
            const queryParams = new URLSearchParams({
                weekStart: getWeekStartForOffset(weekOffset),
                category: 'ALL',
            });
            const res = await apiFetch('/calendar/week?' + queryParams.toString(), {
                signal: request.signal,
            });
            if (!res.ok) throw new Error('Error loading calendar');
            const data: CalendarWeekData = await res.json();
            if (!request.signal.aborted) setCalendarData(data);
        } catch {
            if (!request.signal.aborted) setIsError(true);
        } finally {
            if (!request.signal.aborted) setIsLoading(false);
        }
    }, [weekOffset]);

    useEffect(() => {
        if (!isPro) return;
        void loadCalendar();
        return () => activeRequest.current?.abort();
    }, [isPro, loadCalendar]);

    if (!isPro) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    section="calendar"
                    buttonText="Activar Finix PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    // Formateador de fecha/hora al timezone local
    const formatLocalTime = (dateStr: string, timeStr?: string, timestampUtc?: string) => {
        if (!timeStr && !timestampUtc) return 'Horario pendiente';
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
                className: 'calendar-badge--negative',
                dotColor: 'bg-purple-500',
                isCritical: true,
            };
        }
        if (s >= 70 || imp === 'HIGH') {
            return {
                label: 'ALTO',
                className: 'calendar-badge--negative',
                dotColor: 'bg-rose-500',
                isCritical: false,
            };
        }
        if (s >= 40 || imp === 'MEDIUM') {
            return {
                label: 'MEDIO',
                className: 'calendar-badge--amber',
                dotColor: 'bg-amber-500',
                isCritical: false,
            };
        }
        return {
            label: 'BAJO',
            className: 'calendar-badge--blue',
            dotColor: 'bg-slate-400',
            isCritical: false,
        };
    };

    // Filtrar eventos de economía por categorías secundarias
    const filterEventByCategory = (e: CalendarEvent) => {
        if (activeCategory === 'ALL') return true;
        if (activeCategory === 'US' || activeCategory === 'AR')
            return (e.countryCode || e.country) === activeCategory;
        if (activeCategory === 'RATES')
            return (
                e.category === 'MONETARY_POLICY' ||
                e.category === 'INTEREST_RATES' ||
                e.category === 'CENTRAL_BANK'
            );
        if (activeCategory === 'INFLATION') return e.category === 'INFLATION';
        if (activeCategory === 'EMPLOYMENT') return e.category === 'EMPLOYMENT';
        if (activeCategory === 'GDP') return e.category === 'GDP' || e.category === 'ACTIVITY';
        if (activeCategory === 'TRADE') return e.category === 'TRADE';
        return e.category === activeCategory;
    };

    const totalEconomic =
        calendarData?.days.reduce((total, day) => total + day.economicEvents.length, 0) ?? 0;
    const totalEarnings =
        calendarData?.days.reduce((total, day) => total + day.earningsEvents.length, 0) ?? 0;
    const totalDividends =
        calendarData?.days.reduce((total, day) => total + day.dividendEvents.length, 0) ?? 0;

    const visibleDays = (calendarData?.days ?? []).flatMap((day) => {
        const economic =
            activeSection === 'GENERAL' ? day.economicEvents.filter(filterEventByCategory) : [];
        const earnings =
            activeSection === 'BALANCES' ? sortEarnings(day.earningsEvents, earningsSort) : [];
        const dividends = activeSection === 'DIVIDENDOS' ? day.dividendEvents || [] : [];
        return economic.length || earnings.length || dividends.length
            ? [{ ...day, economic, earnings, dividends }]
            : [];
    });
    const economicUnavailable =
        activeSection === 'GENERAL' &&
        calendarData?.economicData &&
        calendarData.economicData.status !== 'READY';
    const economicStatusMessage =
        calendarData?.economicData?.status === 'NOT_CONFIGURED'
            ? 'La fuente de datos económicos no está configurada.'
            : calendarData?.economicData?.httpStatus === 402
              ? 'La fuente económica no tiene acceso habilitado.'
              : 'No se pudo actualizar la fuente de datos económicos.';

    return (
        <div className="markets-view market-shell calendar-view">
            <div className="market-section">
                <MarketHeader
                    title="Calendario de mercado"
                    eyebrow="AGENDA · FINIX"
                    icon={CalendarIcon}
                    description={
                        <span className="calendar-subtitle">
                            Economía, balances de EE. UU. y dividendos del S&amp;P 500.
                            <span>
                                <Clock size={15} aria-hidden="true" /> Hora local:{' '}
                                {userTimezoneShort}
                            </span>
                        </span>
                    }
                    actions={
                        <div className="calendar-week-controls">
                            <div className="calendar-week-label">
                                <span>
                                    {weekOffset === 0
                                        ? 'Semana actual'
                                        : weekOffset > 0
                                          ? '+' + weekOffset + ' sem.'
                                          : weekOffset + ' sem.'}
                                </span>
                                {calendarData?.weekRange && (
                                    <strong>
                                        {formatDateLabel(calendarData.weekRange.from)} al{' '}
                                        {formatDateLabel(calendarData.weekRange.to)}
                                    </strong>
                                )}
                            </div>
                            <div className="calendar-week-buttons">
                                <button
                                    type="button"
                                    className="calendar-icon-button"
                                    onClick={() => setWeekOffset((w) => Math.max(-4, w - 1))}
                                    disabled={weekOffset <= -4}
                                    title="Semana anterior"
                                    aria-label="Semana anterior"
                                >
                                    <ChevronLeft size={19} />
                                </button>
                                <button
                                    type="button"
                                    className="calendar-icon-button"
                                    onClick={() => setWeekOffset((w) => Math.min(4, w + 1))}
                                    disabled={weekOffset >= 4}
                                    title="Semana siguiente"
                                    aria-label="Semana siguiente"
                                >
                                    <ChevronRight size={19} />
                                </button>
                                <button
                                    type="button"
                                    className="calendar-icon-button"
                                    onClick={() => loadCalendar()}
                                    disabled={isLoading}
                                    title="Actualizar datos"
                                    aria-label="Actualizar datos"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={isLoading ? 'animate-spin' : ''}
                                    />
                                </button>
                            </div>
                        </div>
                    }
                />

                <nav className="market-tabs calendar-tabs" aria-label="Secciones del calendario">
                    {(
                        [
                            { key: 'GENERAL', label: 'General', icon: Globe, count: totalEconomic },
                            {
                                key: 'BALANCES',
                                label: 'Balances',
                                icon: BarChart3,
                                count: totalEarnings,
                            },
                            {
                                key: 'DIVIDENDOS',
                                label: 'Dividendos',
                                icon: Coins,
                                count: totalDividends,
                            },
                        ] as const
                    ).map((section) => (
                        <button
                            type="button"
                            key={section.key}
                            aria-pressed={activeSection === section.key}
                            onClick={() => setActiveSection(section.key)}
                        >
                            <section.icon size={18} aria-hidden="true" />
                            <span>{section.label}</span>
                            {calendarData && (
                                <span className="calendar-count">{section.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {activeSection === 'GENERAL' && (
                    <div className="calendar-filters" aria-label="Indicadores económicos">
                        {[
                            { key: 'ALL', label: 'Todos' },
                            { key: 'US', label: 'Estados Unidos' },
                            { key: 'AR', label: 'Argentina' },
                            { key: 'RATES', label: 'Tasas y Fed' },
                            { key: 'INFLATION', label: 'Inflación' },
                            { key: 'EMPLOYMENT', label: 'Empleo' },
                            { key: 'GDP', label: 'PIB y actividad' },
                            { key: 'TRADE', label: 'Comercio exterior' },
                        ].map((category) => (
                            <button
                                type="button"
                                key={category.key}
                                aria-pressed={activeCategory === category.key}
                                onClick={() => setActiveCategory(category.key)}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                )}

                {activeSection === 'BALANCES' && (
                    <div className="calendar-earnings-toolbar">
                        <span>
                            Balances EE. UU.{' '}
                            <span className="calendar-muted">· Publicados y pendientes</span>
                        </span>
                        <label className="calendar-sort">
                            <ListFilter size={18} aria-hidden="true" />
                            <span>Ordenar por</span>
                            <select
                                value={earningsSort}
                                onChange={(event) =>
                                    setEarningsSort(event.target.value as EarningsSort)
                                }
                                aria-label="Ordenar balances"
                            >
                                <option value="RELEVANCIA">Relevancia</option>
                                <option value="VICTORIOSOS">Superaron estimaciones</option>
                                <option value="DESVICTORIOSOS">Debajo de estimaciones</option>
                                <option value="MIXTOS">Resultados mixtos</option>
                                <option value="PENDIENTES">Pendientes</option>
                            </select>
                        </label>
                    </div>
                )}

                {!isLoading && !isError && economicUnavailable && visibleDays.length > 0 && (
                    <div className="calendar-context mb-6" role="status">
                        <Info size={17} />
                        <p>{economicStatusMessage} Se muestran los eventos guardados.</p>
                    </div>
                )}
                {isLoading ? (
                    <div className="calendar-state" role="status">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Cargando eventos de la semana...</p>
                    </div>
                ) : isError || !calendarData ? (
                    <div className="calendar-state" role="alert">
                        <CalendarIcon size={36} />
                        <h2>No se pudieron cargar los eventos</h2>
                        <p>Revisá tu conexión e intentá de nuevo.</p>
                        <button
                            type="button"
                            className="calendar-retry"
                            onClick={() => loadCalendar()}
                        >
                            <RefreshCw size={17} /> Reintentar
                        </button>
                    </div>
                ) : !visibleDays.length ? (
                    <div className="calendar-state">
                        <CalendarIcon size={36} />
                        <h2>
                            {economicUnavailable
                                ? 'Calendario económico no disponible'
                                : 'No hay eventos disponibles'}
                        </h2>
                        <p>
                            {economicUnavailable
                                ? economicStatusMessage
                                : activeSection === 'GENERAL'
                                  ? 'Sin eventos para este filtro y semana.'
                                  : 'Sin eventos informados para esta semana.'}
                        </p>
                    </div>
                ) : (
                    <div className="calendar-agenda">
                        {visibleDays.map((day) => (
                            <section
                                key={day.date}
                                className="calendar-day"
                                aria-label={day.dayName + ' ' + day.date}
                            >
                                <div className="calendar-day-heading">
                                    <CalendarIcon size={19} aria-hidden="true" />
                                    <h2>{day.dayName}</h2>
                                    <span>{formatDateLabel(day.date)}</span>
                                    {day.isToday && (
                                        <span className="calendar-badge calendar-badge--positive">
                                            Hoy
                                        </span>
                                    )}
                                    <span className="calendar-day-count">
                                        {day.economic.length +
                                            day.earnings.length +
                                            day.dividends.length}{' '}
                                        eventos
                                    </span>
                                </div>
                                <div className="market-grid calendar-event-grid">
                                    {day.economic.map((event) => {
                                        const impact = getImpactBadge(
                                            event.impactScore ?? event.marketImpactScore,
                                            event.importance,
                                        );
                                        return (
                                            <article
                                                key={event.id}
                                                className="market-quote-card calendar-event-card"
                                            >
                                                <div className="calendar-card-meta">
                                                    <span
                                                        className={
                                                            'calendar-badge ' + impact.className
                                                        }
                                                    >
                                                        {impact.isCritical && <Flame size={14} />}
                                                        Impacto {impact.label}
                                                    </span>
                                                    <span className="calendar-time">
                                                        <Clock size={14} />
                                                        {formatLocalTime(
                                                            event.date,
                                                            event.time,
                                                            event.timestampUtc,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="calendar-event-title">
                                                    <span className="calendar-country">
                                                        {event.country === 'AR'
                                                            ? 'Argentina'
                                                            : event.country === 'US'
                                                              ? 'Estados Unidos'
                                                              : event.country}
                                                    </span>
                                                    <h3>{event.title}</h3>
                                                    {event.description && (
                                                        <p>{event.description}</p>
                                                    )}
                                                </div>
                                                {(event.actualValue != null ||
                                                    (event.consensusValue ?? event.forecastValue) !=
                                                        null ||
                                                    event.previousValue != null) && (
                                                    <dl className="calendar-metrics">
                                                        {event.actualValue != null && (
                                                            <div>
                                                                <dt>Actual</dt>
                                                                <dd className="calendar-metric-primary">
                                                                    {event.actualValue}
                                                                    {event.unit
                                                                        ? ' ' + event.unit
                                                                        : ''}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        {(event.consensusValue ??
                                                            event.forecastValue) != null && (
                                                            <div>
                                                                <dt>Estimado</dt>
                                                                <dd>
                                                                    {event.consensusValue ??
                                                                        event.forecastValue}
                                                                    {event.unit
                                                                        ? ' ' + event.unit
                                                                        : ''}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        {event.previousValue != null && (
                                                            <div>
                                                                <dt>Previo</dt>
                                                                <dd>
                                                                    {event.previousValue}
                                                                    {event.unit
                                                                        ? ' ' + event.unit
                                                                        : ''}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        {event.surprise != null && (
                                                            <div>
                                                                <dt>Sorpresa</dt>
                                                                <dd
                                                                    className={
                                                                        event.surprise > 0
                                                                            ? 'calendar-positive'
                                                                            : 'calendar-negative'
                                                                    }
                                                                >
                                                                    {event.surprise > 0 ? '+' : ''}
                                                                    {event.surprise}
                                                                    {event.unit
                                                                        ? ' ' + event.unit
                                                                        : ''}
                                                                </dd>
                                                            </div>
                                                        )}
                                                    </dl>
                                                )}
                                                {event.affectedAssets &&
                                                    event.affectedAssets.length > 0 && (
                                                        <div className="calendar-assets">
                                                            <span>Activos afectados</span>
                                                            {event.affectedAssets.map((asset) => (
                                                                <span
                                                                    key={asset}
                                                                    className="calendar-badge"
                                                                >
                                                                    {asset}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                {event.expectedMarketEffect && (
                                                    <div className="calendar-context">
                                                        <Info size={17} />
                                                        <p>{event.expectedMarketEffect}</p>
                                                    </div>
                                                )}
                                                {event.source && (
                                                    <div className="calendar-card-footer">
                                                        <span>Fuente: {event.source}</span>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}

                                    {day.earnings.map((earn) => {
                                        const timing =
                                            earn.reportTiming === 'AMC'
                                                ? 'Después del cierre'
                                                : earn.reportTiming === 'BMO'
                                                  ? 'Antes de la apertura'
                                                  : earn.reportTiming === 'DMH'
                                                    ? 'Durante la rueda'
                                                    : 'Horario pendiente';
                                        const reported =
                                            earn.actualEps != null || earn.actualRevenue != null;
                                        const outcome = getEarningsOutcome(earn);
                                        const tone =
                                            outcome === 'VICTORIOSO'
                                                ? 'positive'
                                                : outcome === 'DESVICTORIOSO'
                                                  ? 'negative'
                                                  : outcome === 'MIXTO'
                                                    ? 'amber'
                                                    : 'blue';
                                        const epsTone =
                                            earn.epsSurprise == null
                                                ? ''
                                                : earn.epsSurprise >= 0
                                                  ? 'calendar-positive'
                                                  : 'calendar-negative';
                                        const revenueTone =
                                            earn.revenueSurprise == null
                                                ? ''
                                                : earn.revenueSurprise >= 0
                                                  ? 'calendar-positive'
                                                  : 'calendar-negative';
                                        return (
                                            <article
                                                key={earn.id}
                                                className="market-quote-card calendar-event-card"
                                            >
                                                <div className="calendar-card-meta">
                                                    <span className="calendar-time">
                                                        <Clock size={14} />
                                                        {timing}
                                                    </span>
                                                    {reported ? (
                                                        <span
                                                            className={
                                                                'calendar-badge calendar-badge--' +
                                                                tone
                                                            }
                                                        >
                                                            Publicado
                                                        </span>
                                                    ) : (
                                                        earn.dateStatus === 'ESTIMATED' && (
                                                            <span className="calendar-badge calendar-badge--amber">
                                                                Fecha estimada
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                                <div className="calendar-company">
                                                    <div className="calendar-company-logo">
                                                        <AssetLogoImg
                                                            ticker={earn.ticker}
                                                            src={earn.logoUrl}
                                                            name={earn.companyName}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3>{earn.ticker}</h3>
                                                        <p>{earn.companyName}</p>
                                                    </div>
                                                </div>
                                                {reported && (
                                                    <div
                                                        className={
                                                            'calendar-outcome calendar-' + tone
                                                        }
                                                    >
                                                        {outcome === 'VICTORIOSO' ? (
                                                            <CheckCircle2 size={19} />
                                                        ) : outcome === 'DESVICTORIOSO' ? (
                                                            <XCircle size={19} />
                                                        ) : (
                                                            <BarChart3 size={19} />
                                                        )}
                                                        <span>
                                                            {outcome === 'VICTORIOSO'
                                                                ? 'Superó las estimaciones'
                                                                : outcome === 'DESVICTORIOSO'
                                                                  ? 'Debajo de las estimaciones'
                                                                  : outcome === 'MIXTO'
                                                                    ? 'Resultado mixto'
                                                                    : 'Resultado informado'}
                                                        </span>
                                                    </div>
                                                )}
                                                <dl className="calendar-metrics calendar-earnings-metrics">
                                                    <div>
                                                        <dt>
                                                            {reported
                                                                ? 'Ganancias EPS'
                                                                : 'EPS estimado'}
                                                        </dt>
                                                        <dd
                                                            className={
                                                                'calendar-metric-primary ' + epsTone
                                                            }
                                                        >
                                                            {reported
                                                                ? earn.actualEps != null
                                                                    ? '$' +
                                                                      earn.actualEps.toFixed(2)
                                                                    : 'N/D'
                                                                : earn.epsEstimate != null
                                                                  ? '$' +
                                                                    earn.epsEstimate.toFixed(2)
                                                                  : 'N/D'}
                                                        </dd>
                                                        {reported && (
                                                            <>
                                                                <dd className="calendar-metric-detail">
                                                                    Est.{' '}
                                                                    {earn.epsEstimate != null
                                                                        ? '$' +
                                                                          earn.epsEstimate.toFixed(
                                                                              2,
                                                                          )
                                                                        : 'N/D'}
                                                                </dd>
                                                                <dd
                                                                    className={
                                                                        'calendar-metric-detail ' +
                                                                        epsTone
                                                                    }
                                                                >
                                                                    {earn.epsSurprise != null
                                                                        ? (earn.epsSurprise >= 0
                                                                              ? '+'
                                                                              : '') +
                                                                          earn.epsSurprise.toFixed(
                                                                              1,
                                                                          ) +
                                                                          '% vs. est.'
                                                                        : 'Sin comparación'}
                                                                </dd>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <dt>
                                                            {reported
                                                                ? 'Facturación'
                                                                : 'Facturación est.'}
                                                        </dt>
                                                        <dd
                                                            className={
                                                                'calendar-metric-primary ' +
                                                                revenueTone
                                                            }
                                                        >
                                                            {formatRevenue(
                                                                reported
                                                                    ? earn.actualRevenue
                                                                    : earn.revenueEstimate,
                                                            )}
                                                        </dd>
                                                        {reported && (
                                                            <>
                                                                <dd className="calendar-metric-detail">
                                                                    Est.{' '}
                                                                    {formatRevenue(
                                                                        earn.revenueEstimate,
                                                                    )}
                                                                </dd>
                                                                <dd
                                                                    className={
                                                                        'calendar-metric-detail ' +
                                                                        revenueTone
                                                                    }
                                                                >
                                                                    {earn.revenueSurprise != null
                                                                        ? (earn.revenueSurprise >= 0
                                                                              ? '+'
                                                                              : '') +
                                                                          earn.revenueSurprise.toFixed(
                                                                              1,
                                                                          ) +
                                                                          '% vs. est.'
                                                                        : 'Sin comparación'}
                                                                </dd>
                                                            </>
                                                        )}
                                                    </div>
                                                </dl>
                                                <div className="calendar-card-footer">
                                                    {earn.marketCap ? (
                                                        <span>
                                                            Cap. {formatMarketCap(earn.marketCap)}
                                                        </span>
                                                    ) : (
                                                        <span>EE. UU.</span>
                                                    )}
                                                    {earn.marketReaction != null && (
                                                        <span className="calendar-reaction">
                                                            <span>Reacción</span>
                                                            <MarketChange
                                                                value={earn.marketReaction}
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}

                                    {day.dividends.map((dividend) => (
                                        <article
                                            key={dividend.id}
                                            className="market-quote-card calendar-event-card"
                                        >
                                            <div className="calendar-card-meta">
                                                <span className="calendar-country">
                                                    S&amp;P 500
                                                </span>
                                                {dividend.frequency && (
                                                    <span className="calendar-badge">
                                                        {dividend.frequency}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="calendar-company">
                                                <div className="calendar-company-logo">
                                                    <AssetLogoImg
                                                        ticker={dividend.ticker}
                                                        src={dividend.logoUrl}
                                                        name={dividend.companyName}
                                                    />
                                                </div>
                                                <div>
                                                    <h3>{dividend.ticker}</h3>
                                                    <p>{dividend.companyName}</p>
                                                </div>
                                            </div>
                                            <div className="market-quote-card__quote">
                                                <span className="market-quote-card__quote-label">
                                                    Dividendo por acción<span>USD</span>
                                                </span>
                                                <div className="market-quote-card__numbers">
                                                    <span className="market-quote-card__price">
                                                        {dividend.amount != null
                                                            ? '$' +
                                                              dividend.amount
                                                                  .toFixed(4)
                                                                  .replace(/\.?0+$/, '')
                                                            : 'N/D'}
                                                    </span>
                                                    {dividend.yield != null && (
                                                        <span className="calendar-badge calendar-badge--positive">
                                                            <ArrowUpRight size={15} />
                                                            {dividend.yield.toFixed(2)}% yield
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="calendar-card-footer calendar-dividend-dates">
                                                <span>
                                                    <span>Ex-dividendo</span>
                                                    <strong>
                                                        {dividend.exDate
                                                            ? formatDateLabel(dividend.exDate)
                                                            : 'Sin anunciar'}
                                                    </strong>
                                                </span>
                                                <span>
                                                    <span>Fecha de pago</span>
                                                    <strong>
                                                        {dividend.paymentDate
                                                            ? formatDateLabel(dividend.paymentDate)
                                                            : 'Sin anunciar'}
                                                    </strong>
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
