import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
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
                    setEvents(Array.isArray(data?.events) ? data.events : []);
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
            className="rounded-2xl border transition-all duration-300 overflow-hidden shrink-0"
            style={{
                background: 'var(--card-bg, hsl(var(--card)))',
                borderColor: 'hsl(var(--border) / 0.55)',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                            background: 'hsl(280 65% 60% / 0.15)',
                            color: 'hsl(280 75% 65%)',
                        }}
                    >
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-[14px] font-bold tracking-tight text-foreground">
                        Calendario
                    </span>
                </div>
                <button
                    onClick={() => navigate('/calendario')}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                    Ver todos
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-3.5 pb-4 space-y-2.5">
                {isLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-[11.5px] font-medium">Cargando eventos...</span>
                    </div>
                ) : isError || events.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                        <p className="text-[12.5px]">No hay eventos destacados para esta semana</p>
                    </div>
                ) : (
                    events.map((evt) => {
                        const isEarnings = evt.type === 'EARNINGS';
                        const flag = evt.country === 'AR' ? '🇦🇷' : '🇺🇸';
                        const isHighImpact = evt.importance === 'HIGH' || evt.impactScore >= 80;

                        return (
                            <div
                                key={evt.id}
                                onClick={() => navigate('/calendario')}
                                className="p-3 pb-3.5 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group flex items-start gap-3"
                            >
                                {/* Left Time/Day Box */}
                                <div className="flex flex-col items-center justify-center min-w-[48px] py-1 px-1.5 rounded-lg bg-background/80 border border-border/30 text-center flex-shrink-0">
                                    <span className="text-[10px] font-extrabold tracking-wider text-muted-foreground">
                                        {evt.dayLabel}
                                    </span>
                                    <span className="text-[12px] font-black text-foreground">
                                        {evt.time || (isEarnings ? 'Cierre' : '--:--')}
                                    </span>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    {/* Category / Badge header */}
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        {isEarnings ? (
                                            <>
                                                <span className="text-[10px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                    📊 RESULTADOS
                                                </span>
                                                {evt.dateStatus === 'ESTIMATED' && (
                                                    <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1 rounded">
                                                        Fecha estimada
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span
                                                className={`text-[9.5px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded border ${isHighImpact
                                                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                                                    : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
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
                                        <p className="text-[13px] font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                            {evt.title}
                                        </p>
                                    </div>

                                    {/* Subtitle / Details */}
                                    {isEarnings ? (
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {evt.timingLabel ? `${evt.timingLabel} · ` : ''}
                                            {evt.epsEstimate != null ? `EPS est: $${evt.epsEstimate.toFixed(2)}` : 'Presenta resultados'}
                                            {evt.revenueEstimate != null ? ` · Rev est: $${evt.revenueEstimate}B` : ''}
                                        </p>
                                    ) : (
                                        (evt.consensusValue || evt.previousValue) ? (
                                            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                {evt.consensusValue && (
                                                    <span>Consenso: <strong className="text-foreground/90">{evt.consensusValue}</strong></span>
                                                )}
                                                {evt.previousValue && <span> · Ant: {evt.previousValue}</span>}
                                            </p>
                                        ) : (
                                            evt.subtitle && (
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{evt.subtitle}</p>
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
export default CalendarPreviewCard;
