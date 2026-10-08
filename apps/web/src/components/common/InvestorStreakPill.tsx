import { useState, useEffect, useRef } from 'react';
import { Flame, Calendar, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvestorStreak } from '@/hooks/useInvestorStreak';

interface InvestorStreakPillProps {
    className?: string;
}

export function InvestorStreakPill({ className = '' }: InvestorStreakPillProps) {
    const { streak, weekDays, nextMilestone, progressPercent, isTodayActive } = useInvestorStreak();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[11.5px] font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none shadow-2xs backdrop-blur-xs bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 ${className}`}
                title={`Racha Inversora: ${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}`}
                aria-label={`Racha Inversora: ${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}`}
            >
                <Flame className={`w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 ${isTodayActive ? 'animate-pulse' : ''}`} />
                <span className="tracking-tight whitespace-nowrap hidden xs:inline">
                    {streak} {streak === 1 ? 'día de racha' : 'días de racha'}
                </span>
                <span className="tracking-tight whitespace-nowrap xs:hidden font-black">
                    {streak}d
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 z-50 w-[min(320px,calc(100vw-24px))] max-w-[calc(100vw-24px)] p-3.5 sm:p-4 text-xs space-y-3.5 rounded-2xl shadow-xl bg-card border border-border text-foreground"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                    <Flame className="w-4 h-4 fill-amber-500" />
                                </span>
                                <div>
                                    <h4 className="text-sm font-bold leading-tight">Racha Inversora</h4>
                                    <span className="text-[11px] font-semibold text-amber-500">
                                        🔥 {streak} {streak === 1 ? 'día consecutivo' : 'días consecutivos'}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                                aria-label="Cerrar modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Motivational copy */}
                        <p className="text-muted-foreground text-[11px] sm:text-[11.5px] leading-relaxed">
                            {streak >= 7
                                ? '¡Excelente constancia! Analizar mercados e ideas a diario fortalece el criterio y la disciplina de los mejores inversores.'
                                : '¡Gran disciplina! Ingresar a diario para analizar mercados, portafolios e ideas construye el hábito de los mejores inversores.'}
                        </p>

                        {/* Weekly streak real calendar */}
                        <div className="pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-muted-foreground" /> Esta semana
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">Meta: 7 días</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                                {weekDays.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1" title={`${d.fullLabel} (${d.dateStr})`}>
                                        <div
                                            className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[9.5px] sm:text-[10px] transition-all ${
                                                d.isActive
                                                    ? `bg-amber-500 text-white shadow-xs shadow-amber-500/30 ${d.isToday ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-card' : ''}`
                                                    : d.isToday
                                                        ? 'border-2 border-amber-500 text-amber-500 bg-amber-500/10 animate-pulse'
                                                        : d.isPast
                                                            ? 'bg-secondary/40 text-muted-foreground/40 border border-border/40'
                                                            : 'border border-dashed border-border/70 text-muted-foreground/50 bg-transparent'
                                            }`}
                                        >
                                            {d.isActive ? (
                                                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
                                            ) : (
                                                d.label
                                            )}
                                        </div>
                                        <span className={`text-[8.5px] sm:text-[9px] font-medium ${d.isToday ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                                            {d.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next Milestone */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-bold text-foreground/90">
                                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Próximo logro:</span>
                                </span>
                                <span className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400">
                                    {streak}/{nextMilestone.targetDays} días
                                </span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-tight">
                                <strong>{nextMilestone.badgeName}</strong> ({nextMilestone.description}).
                            </p>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-1.5">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default InvestorStreakPill;
