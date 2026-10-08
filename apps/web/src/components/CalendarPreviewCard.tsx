import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatFinancialAmount, hasEarningsData, normalizeEarnings, formatEconomicEventTitle } from '@finix/shared';
import { AssetLogoImg } from '@/components/TopGainersCard';

interface CalendarHomeItem {
    id: string;
    type: 'EARNINGS' | 'ECONOMIC';
    country?: string; // US, AR
    ticker?: string;
    title: string;
    subtitle?: string;
    date: string;
    time?: string;
    dayLabel: string;
    timingLabel?: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    impactScore: number;
    logoUrl?: string;
    epsEstimate?: number;
    revenueEstimate?: number;
    actualEps?: number;
    actualRevenue?: number;
    previousValue?: string;
    consensusValue?: string;
    dateStatus?: 'CONFIRMED' | 'ESTIMATED';
}

export function CalendarPreviewCard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarHomeItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        apiFetch('/calendar/home')
            .then(res => {
                if (!res.ok) throw new Error('Error fetching calendar preview');
                return res.json();
            })
            .then(data => {
                if (isMounted) {
                    setEvents(Array.isArray(data?.events) ? data.events.map((event: CalendarHomeItem) => event.type === 'EARNINGS' ? normalizeEarnings(event) : event).filter((event: CalendarHomeItem) => event.type !== 'EARNINGS' || hasEarningsData(event)) : []);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsError(true);
                    setIsLoading(false);
                }
            });
        return () => { isMounted = false; };
    }, []);

    return (
        <div
            className="calendar-preview-card rounded-2xl border transition-all duration-300 overflow-hidden flex-1 flex flex-col min-h-0 shadow-sm"
            style={{
                background: 'var(--card-bg, hsl(var(--card)))',
                borderColor: 'hsl(var(--border) / 0.6)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs"
                        style={{
                            background: 'hsl(280 65% 60% / 0.15)',
                            color: 'hsl(280 75% 65%)',
                        }}
                    >
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-[14.5px] font-bold tracking-tight text-foreground">
                        Calendario
                    </span>
                </div>
                <button
                    onClick={() => navigate('/calendario')}
                    className="text-[12px] font-bold text-muted-foreground/80 hover:text-primary transition-colors flex items-center gap-0.5 group"
                >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-2.5 flex-1 flex flex-col justify-between min-h-0">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-[12px] font-medium">Cargando eventos...</span>
                    </div>
                ) : isError || events.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6 text-center text-muted-foreground">
                        <p className="text-[13px] font-medium">No hay eventos destacados para esta semana</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-between min-h-0 gap-2">
                        {events.slice(0, 3).map((evt) => {
                            const isEarnings = evt.type === 'EARNINGS';
                            const flag = evt.country === 'AR' ? '🇦🇷' : '🇺🇸';
                            const isHighImpact = evt.importance === 'HIGH' || evt.impactScore >= 80;

                            return (
                                <Link
                                    key={evt.id}
                                    to="/calendario"
                                    className="flex-1 flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/50 transition-all cursor-pointer group"
                                >
                                    {/* Left Time/Day Box */}
                                    <div className="flex flex-col items-center justify-center min-w-[50px] py-1.5 px-2 rounded-xl bg-background/90 border border-border/40 text-center flex-shrink-0 shadow-2xs">
                                        <span className="text-[11px] font-extrabold tracking-wider text-muted-foreground">
                                            {evt.dayLabel}
                                        </span>
                                        <span className="text-[13px] font-black text-foreground">
                                            {evt.time || (evt.timingLabel === 'Después del cierre' ? 'Cierre' : evt.timingLabel === 'Antes de la apertura' ? 'Apertura' : evt.timingLabel === 'Durante la rueda' ? 'Rueda' : 'Pendiente')}
                                        </span>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0">
                                        {/* Category / Badge header */}
                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            {isEarnings ? (
                                                <>
                                                    <span className="text-[10px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">
                                                        📊 RESULTADOS
                                                    </span>
                                                    {evt.dateStatus === 'ESTIMATED' && (
                                                        <span className="text-[9.5px] font-semibold text-muted-foreground bg-secondary px-1.5 rounded">
                                                            Fecha estimada
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span
                                                    className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border shadow-2xs ${isHighImpact
                                                        ? 'text-rose-500 bg-rose-500/10 border-rose-500/25'
                                                        : 'text-amber-500 bg-amber-500/10 border-amber-500/25'
                                                        }`}
                                                >
                                                    {flag} IMPACTO {evt.importance === 'HIGH' ? 'ALTO' : 'MEDIO'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Logo */}
                                        <div className="flex items-center gap-2">
                                            {isEarnings && evt.ticker && (
                                                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    <AssetLogoImg
                                                        ticker={evt.ticker}
                                                        src={evt.logoUrl}
                                                        name={evt.title}
                                                    />
                                                </div>
                                            )}
                                            <p className="text-[13.5px] font-bold text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                                                {isEarnings ? evt.title : formatEconomicEventTitle(evt.title, evt.country)}
                                            </p>
                                        </div>

                                        {/* Subtitle / Details */}
                                        {isEarnings ? (
                                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                                                {evt.timingLabel ? `${evt.timingLabel} · ` : ''}
                                                {[
                                                    evt.actualEps != null ? `EPS: $${evt.actualEps.toFixed(2)}` : evt.epsEstimate != null ? `EPS est.: $${evt.epsEstimate.toFixed(2)}` : '',
                                                    evt.actualRevenue != null ? `Facturación: ${formatFinancialAmount(evt.actualRevenue)}` : evt.revenueEstimate != null ? `Facturación est.: ${formatFinancialAmount(evt.revenueEstimate)}` : '',
                                                ].filter(Boolean).join(' · ')}
                                            </p>
                                        ) : (
                                            (evt.consensusValue || evt.previousValue) ? (
                                                <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-tight truncate">
                                                    {evt.consensusValue && (
                                                        <span>Consenso: <strong className="text-foreground/90">{evt.consensusValue}</strong></span>
                                                    )}
                                                    {evt.previousValue && <span> · Ant: {evt.previousValue}</span>}
                                                </p>
                                            ) : (
                                                evt.subtitle && (
                                                    <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{evt.subtitle}</p>
                                                )
                                            )
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CalendarPreviewCard;
