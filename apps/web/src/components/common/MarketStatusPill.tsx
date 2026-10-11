import { useState, useEffect, useRef } from 'react';
import { Clock, Zap, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketState {
    status: 'OPEN' | 'PRE_MARKET' | 'CLOSED';
    label: string;
    shortLabel: string;
    detail: string;
    dotColor: string;
    textColor: string;
    bgColor: string;
}

export function getWallStreetStatus(now = new Date()): MarketState {
    // Time in US Eastern (New York)
    const nyDateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyDate = new Date(nyDateStr);
    const day = nyDate.getDay(); // 0 = Sun, 6 = Sat
    const hours = nyDate.getHours();
    const minutes = nyDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const offsetName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;
    const offsetHours = Number(offsetName?.match(/GMT(-?\d+)/)?.[1] ?? -5);
    const openArt = `${String(9 - offsetHours - 3).padStart(2, '0')}:30`;
    const closeArt = `${String(16 - offsetHours - 3).padStart(2, '0')}:00`;
    const openTime = 9 * 60 + 30;  // 09:30 America/New_York
    const closeTime = 16 * 60;     // 16:00 EST

    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday && timeInMinutes >= openTime && timeInMinutes < closeTime) {
        const minutesLeft = closeTime - timeInMinutes;
        const h = Math.floor(minutesLeft / 60);
        const m = minutesLeft % 60;
        const timeLeftStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

        return {
            status: 'OPEN',
            label: `Horario regular · Cierra en ${timeLeftStr}`,
            shortLabel: `Horario regular · ${timeLeftStr}`,
            detail: `Horario regular estimado · Cierre ${closeArt} Argentina / 16:00 Nueva York (restan ${timeLeftStr}). No confirma feriados, cierres anticipados ni interrupciones.`,
            dotColor: 'bg-emerald-500',
            textColor: 'text-emerald-500 dark:text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/25',
        };
    }

    return {
        status: 'CLOSED',
        label: `Fuera del horario regular · Apertura ${openArt} ARG`,
        shortLabel: `Fuera de horario · ${openArt} ARG`,
        detail: `Horario habitual: ${openArt}–${closeArt} Argentina, 09:30–16:00 Nueva York. No confirma la próxima sesión: feriados y cierres anticipados requieren el calendario de la bolsa.`,
        dotColor: 'bg-amber-500 dark:bg-amber-400',
        textColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15',
    };
}

export function MarketStatusPill({ className = '' }: { className?: string }) {
    const [state, setState] = useState<MarketState>(getWallStreetStatus);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setState(getWallStreetStatus());
        const timer = setInterval(() => {
            setState(getWallStreetStatus());
        }, 15_000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsOpen(v => !v)}
                className={`inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none shadow-2xs backdrop-blur-xs ${state.bgColor} ${state.textColor} ${className}`}
                title={state.detail}
                aria-label={`Estado del mercado: ${state.label}`}
            >
                <span className="relative flex h-2 w-2 shrink-0">
                    {state.status === 'OPEN' ? (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </>
                    ) : (
                        <span className={`inline-flex rounded-full h-2 w-2 ${state.dotColor} ring-1 ring-black/10 dark:ring-white/10`} />
                    )}
                </span>
                <span className="tracking-tight whitespace-nowrap font-medium">
                    <span className="hidden sm:inline">{state.label}</span>
                    <span className="sm:hidden">{state.shortLabel}</span>
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 z-50 w-[min(288px,calc(100vw-32px))] p-3.5 text-xs space-y-2 rounded-2xl shadow-xl bg-card border border-border text-foreground"
                    >
                        <div className="flex items-center justify-between font-bold text-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>Wall Street (NYSE / NASDAQ)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Cerrar detalle del horario" className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11.5px]">
                            {state.detail}
                        </p>
                        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Horario regular (Nueva York):</span>
                                <strong className="text-foreground">09:30 - 16:00 hs</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Horario Buenos Aires (ART):</span>
                                <strong className="text-foreground">Varía según la hora de Nueva York</strong>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function FearAndGreedPill({ className = '' }: { className?: string }) {
    const [fng, setFng] = useState<{ value: number; label: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        fetch('https://api.alternative.me/fng/?limit=1')
            .then(res => res.json())
            .then(data => {
                if (isMounted && data?.data?.[0]?.value != null) {
                    const val = Number(data.data[0].value);
                    if (!Number.isFinite(val) || val < 0 || val > 100) return;
                    let lbl = 'Neutral';
                    if (val >= 75) lbl = 'Codicia Extrema';
                    else if (val >= 55) lbl = 'Codicia';
                    else if (val <= 25) lbl = 'Miedo Extremo';
                    else if (val <= 45) lbl = 'Miedo';
                    setFng({ value: val, label: lbl });
                }
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!fng) return <span role="status" className="text-xs text-muted-foreground">Índice cripto: sin datos disponibles</span>;

    const isGreed = fng.value >= 55;
    const isFear = fng.value <= 45;

    const colorClass = isGreed
        ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
        : isFear
            ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
            : 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/25';

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsOpen(v => !v)}
                className={`inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none shadow-2xs backdrop-blur-xs ${colorClass} ${className}`}
                title={`Índice Miedo y Codicia: ${fng.label} (${fng.value}/100)`}
            >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="tracking-tight whitespace-nowrap">
                    <span className="hidden 2xl:inline">{fng.label}: </span>
                    <strong>{fng.value}/100</strong>
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 sm:left-0 mt-2 z-50 w-72 p-3.5 text-xs space-y-2.5 rounded-2xl shadow-xl bg-card border border-border text-foreground"
                    >
                        <div className="flex items-center justify-between font-bold text-foreground">
                            <span className="flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Sentimiento del mercado cripto
                            </span>
                            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-secondary font-bold">
                                {fng.value}/100
                            </span>
                        </div>

                        {/* Gauge progress bar */}
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden relative">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isGreed ? 'bg-emerald-500' : isFear ? 'bg-rose-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, Math.max(5, fng.value))}%` }}
                            />
                        </div>

                        <p className="text-muted-foreground leading-relaxed text-[11.5px]">
                            Índice cripto de Alternative.me: escala de 0 a 100. No representa el mercado de acciones.
                        </p>

                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/50 text-[10px] text-center font-medium">
                            <div className="p-1 rounded bg-rose-500/10 text-rose-500 font-bold">0-45 Miedo</div>
                            <div className="p-1 rounded bg-amber-500/10 text-amber-500 font-bold">46-54 Neutral</div>
                            <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 font-bold">55-100 Codicia</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
