import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatFinancialAmount, hasEarningsData, normalizeEarnings, formatEconomicEventTitle } from '@finix/shared';
import { useTranslation } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';

type EventType = 'EARNINGS' | 'DIVIDEND' | 'ECONOMIC';
interface CalendarHomeItem {
    id: string; type: EventType; title: string; date: string; country?: string; ticker?: string;
    time?: string; timingLabel?: string; importance?: string; impactScore?: number;
    actualEps?: number; epsEstimate?: number; actualRevenue?: number; revenueEstimate?: number;
    dateStatus?: string; previousValue?: string; consensusValue?: string; actualValue?: string;
    amount?: number; exDate?: string; paymentDate?: string; dateKind?: 'EX_DATE' | 'PAYMENT_DATE';
}
const TYPES: EventType[] = ['EARNINGS', 'DIVIDEND', 'ECONOMIC'];

export function CalendarPreviewCard({ rotationIndex, onRotationPauseChange }: {
    rotationIndex: number;
    onRotationPauseChange: (paused: boolean) => void;
}) {
    const { ui } = useTranslation();
    const language = usePreferencesStore(state => state.language);
    const [events, setEvents] = useState<CalendarHomeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const loadEvents = useCallback(async (signal?: AbortSignal, showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const response = await apiFetch('/calendar/home', { signal });
            if (!response.ok) throw new Error('calendar');
            const data = await response.json();
            if (!signal?.aborted) {
                setEvents((Array.isArray(data.events) ? data.events : [])
                    .map((event: CalendarHomeItem) => event.type === 'EARNINGS' ? normalizeEarnings(event) : event)
                    .filter((event: CalendarHomeItem) => TYPES.includes(event.type) && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && (event.type !== 'EARNINGS' || hasEarningsData(event))));
                setError(false);
            }
        } catch {
            if (!signal?.aborted) setError(true);
        } finally {
            if (showLoading && !signal?.aborted) setLoading(false);
        }
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        void loadEvents(controller.signal, true);
        return () => controller.abort();
    }, [loadEvents]);
    useEffect(() => {
        const timer = window.setInterval(() => {
            if (!document.hidden) void loadEvents();
        }, 30_000);
        return () => window.clearInterval(timer);
    }, [loadEvents]);
    const groups = useMemo(() => TYPES.map(type => events.filter(event => event.type === type)), [events]);
    const maxPages = Math.max(1, ...groups.map(group => group.length));
    const page = rotationIndex % maxPages;
    const date = (value: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => {
        const parsed = new Date(value + 'T12:00:00');
        return Number.isNaN(parsed.getTime()) ? ui('Fecha pendiente') : parsed.toLocaleDateString(language, options);
    };
    const labels = { EARNINGS: ui('Balance'), DIVIDEND: ui('Dividendo'), ECONOMIC: ui('Dato económico') };
    const colors = { EARNINGS: 'text-amber-700 dark:text-amber-400 bg-amber-500/10', DIVIDEND: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10', ECONOMIC: 'text-violet-700 dark:text-violet-400 bg-violet-500/10' };
    const empty = { EARNINGS: ui('Sin balances confirmados esta semana'), DIVIDEND: ui('Sin dividendos confirmados esta semana'), ECONOMIC: ui('Sin datos económicos confirmados esta semana') };
    const detail = (event: CalendarHomeItem) => {
        if (event.type === 'DIVIDEND') return [
            event.amount != null ? new Intl.NumberFormat(language, { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(event.amount) + ' ' + ui('por acción') : '',
            event.paymentDate ? `${ui('Pago')}: ${date(event.paymentDate)}` : ui('Pago pendiente'),
        ].filter(Boolean).join(' · ');
        if (event.type === 'EARNINGS') return [
            event.actualEps != null ? `EPS: ${event.actualEps.toFixed(2)}` : event.epsEstimate != null ? `EPS ${ui('est.')}: ${event.epsEstimate.toFixed(2)}` : '',
            event.actualRevenue != null ? `${ui('Ingresos')}: ${formatFinancialAmount(event.actualRevenue)}` : event.revenueEstimate != null ? `${ui('Ingresos est.')}: ${formatFinancialAmount(event.revenueEstimate)}` : '',
        ].filter(Boolean).join(' · ');
        return [event.actualValue != null ? `${ui('Actual')}: ${event.actualValue}` : '', event.consensusValue != null ? `${ui('Consenso')}: ${event.consensusValue}` : '', event.previousValue != null ? `${ui('Anterior')}: ${event.previousValue}` : ''].filter(Boolean).join(' · ');
    };
    return (
        <section className="calendar-preview-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
            onFocusCapture={() => onRotationPauseChange(true)}
            onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onRotationPauseChange(false); }} aria-label={ui('Calendario')}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500"><Calendar className="h-4 w-4" /></span><h3 className="text-sm font-bold">{ui('Calendario')}</h3></div>
                <div className="flex shrink-0 items-center gap-1">
                    <Link to="/calendario" className="inline-flex min-h-11 items-center gap-0.5 whitespace-nowrap text-xs font-semibold text-primary">{ui('Ver todos')}<ChevronRight className="h-3.5 w-3.5" /></Link>
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
                {loading ? <div className="flex flex-1 items-center justify-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{ui('Cargando eventos...')}</div>
                    : error && !events.length ? <p role="status" className="p-5 text-center text-xs text-muted-foreground">{ui('No se pudo cargar el calendario. Volvé a intentarlo.')}</p>
                    : TYPES.map((type, index) => {
                        const group = groups[index], event = group.length ? group[page % group.length] : null;
                        return <Link key={type} data-event-type={type} data-event-id={event?.id || ''} to="/calendario" className="calendar-preview-event flex min-h-0 flex-1 items-center gap-2.5 rounded-xl border border-border/40 bg-secondary/20 p-2.5 transition-colors hover:bg-secondary/60">
                            <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border/50 bg-background px-1 py-1.5 text-center">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{event ? date(event.date, { weekday: 'short' }) : '—'}</span>
                                <span className="whitespace-nowrap text-xs font-bold">{event ? date(event.date) : '—'}</span>
                                {event?.time && <span className="text-[10px] text-muted-foreground">{event.time}</span>}
                            </div>
                            <div className="min-w-0 flex-1" key={event?.id || type}>
                                <div className="mb-0.5 flex flex-wrap items-center gap-1"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${colors[type]}`}>{labels[type]}</span>
                                    {event?.dateStatus === 'ESTIMATED' && <span className="text-[9px] text-muted-foreground">{ui('Fecha estimada')}</span>}
                                    {event?.type === 'DIVIDEND' && <span className="text-[9px] text-muted-foreground">{ui(event.dateKind === 'PAYMENT_DATE' ? 'Fecha de pago' : 'Ex dividendo')}</span>}
                                </div>
                                <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground" title={event?.title}>{event ? (event.type === 'ECONOMIC' ? formatEconomicEventTitle(event.title, event.country) : [event.ticker, event.title].filter(Boolean).join(' · ')) : empty[type]}</p>
                                {event && <p className="mt-0.5 truncate text-[10px] leading-snug text-muted-foreground" title={detail(event)}>{detail(event) || (event.timingLabel ? ui(event.timingLabel) : '')}</p>}
                            </div>
                        </Link>;
                    })}
            </div>
        </section>
    );
}
export default CalendarPreviewCard;
