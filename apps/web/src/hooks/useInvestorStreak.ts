import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface WeekDayStatus {
    label: string;
    fullLabel: string;
    dateStr: string;
    dayNumber: number;
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
    isActive: boolean;
}

export interface StreakMilestone {
    targetDays: number;
    badgeName: string;
    description: string;
    icon: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
    { targetDays: 3, badgeName: 'Iniciación', description: 'Primeros 3 días en los mercados', icon: '🌱' },
    { targetDays: 7, badgeName: 'Insignia de Consistencia', description: '1 semana completa de análisis y disciplina', icon: '⚡' },
    { targetDays: 14, badgeName: 'Insignia de Compromiso', description: '2 semanas consecutivas operando', icon: '🎯' },
    { targetDays: 30, badgeName: 'Disciplina Férrea', description: '1 mes completo analizando mercados', icon: '🏆' },
    { targetDays: 60, badgeName: 'Maestría Financiera', description: '2 meses de consistencia inversora', icon: '💎' },
    { targetDays: 100, badgeName: 'Leyenda de Wall Street', description: '100 días de visión de mercado ininterrumpida', icon: '👑' },
];

export interface StreakData {
    streak: number;
    longestStreak: number;
    lastActiveDate: string;
    activeDates: string[];
}

export function getLocalDateKey(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
    const [y1, m1, d1] = dateStrA.split('-').map(Number);
    const [y2, m2, d2] = dateStrB.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function getStorageKey(userId?: string | null): string {
    return userId ? `finix_streak_${userId}` : 'finix_investor_streak';
}

function calculateCurrentWeek(activeDatesSet: Set<string>, todayStr: string, now: Date = new Date()): WeekDayStatus[] {
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayMeta = [
        { label: 'L', fullLabel: 'Lunes' },
        { label: 'M', fullLabel: 'Martes' },
        { label: 'M', fullLabel: 'Miércoles' },
        { label: 'J', fullLabel: 'Jueves' },
        { label: 'V', fullLabel: 'Viernes' },
        { label: 'S', fullLabel: 'Sábado' },
        { label: 'D', fullLabel: 'Domingo' },
    ];

    return dayMeta.map((meta, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = getLocalDateKey(d);
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;
        const isFuture = dateStr > todayStr;
        const isActive = activeDatesSet.has(dateStr);

        return {
            label: meta.label,
            fullLabel: meta.fullLabel,
            dateStr,
            dayNumber: d.getDate(),
            isToday,
            isPast,
            isFuture,
            isActive,
        };
    });
}

function readAndProcessStreak(userId?: string | null): StreakData {
    if (typeof window === 'undefined') {
        const today = getLocalDateKey();
        return { streak: 1, longestStreak: 1, lastActiveDate: today, activeDates: [today] };
    }

    const key = getStorageKey(userId);
    const fallbackKey = 'finix_investor_streak';
    const raw = localStorage.getItem(key) || localStorage.getItem(fallbackKey);
    const today = getLocalDateKey();

    let data: Partial<StreakData> = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch { }
    }

    let streak = typeof data.streak === 'number' && data.streak > 0 ? data.streak : 4;
    let longestStreak = typeof data.longestStreak === 'number' ? data.longestStreak : streak;
    let lastDate = data.lastActiveDate || (data as any).lastDate;
    let activeDates: string[] = Array.isArray(data.activeDates) ? [...data.activeDates] : [];

    // If activeDates is empty (migration from legacy format), construct active dates backward from lastDate
    if (activeDates.length === 0 && lastDate) {
        const anchor = new Date(lastDate + 'T12:00:00');
        for (let i = 0; i < streak; i++) {
            const prev = new Date(anchor);
            prev.setDate(anchor.getDate() - i);
            activeDates.unshift(getLocalDateKey(prev));
        }
    }

    if (!lastDate) {
        // Initializing fresh user
        lastDate = today;
        streak = Math.max(1, streak);
        activeDates = [today];
    } else if (lastDate === today) {
        // Already recorded today
        if (!activeDates.includes(today)) {
            activeDates.push(today);
        }
    } else {
        const diff = diffCalendarDays(lastDate, today);
        if (diff === 1) {
            // Consecutive day: increment streak
            streak += 1;
            longestStreak = Math.max(longestStreak, streak);
            lastDate = today;
            if (!activeDates.includes(today)) {
                activeDates.push(today);
            }
        } else if (diff > 1) {
            // Broken streak: resets to 1
            streak = 1;
            lastDate = today;
            if (!activeDates.includes(today)) {
                activeDates.push(today);
            }
        }
    }

    // Keep active dates clean and sorted (last 60 days max)
    const uniqueDates = Array.from(new Set(activeDates)).sort().slice(-60);

    const result: StreakData = {
        streak,
        longestStreak: Math.max(longestStreak, streak),
        lastActiveDate: lastDate,
        activeDates: uniqueDates,
    };

    try {
        localStorage.setItem(key, JSON.stringify(result));
        if (key !== fallbackKey) {
            localStorage.setItem(fallbackKey, JSON.stringify(result));
        }
    } catch { }

    return result;
}

export function useInvestorStreak() {
    const user = useAuthStore(state => state.user);
    const userId = user?.id || null;

    const [streakData, setStreakData] = useState<StreakData>(() => readAndProcessStreak(userId));

    const refreshStreak = useCallback(() => {
        const updated = readAndProcessStreak(userId);
        setStreakData(updated);
    }, [userId]);

    useEffect(() => {
        refreshStreak();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === getStorageKey(userId) || e.key === 'finix_investor_streak') {
                refreshStreak();
            }
        };

        const handleCustomUpdate = () => {
            refreshStreak();
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('finix_streak_updated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('finix_streak_updated', handleCustomUpdate);
        };
    }, [userId, refreshStreak]);

    const activeSet = new Set(streakData.activeDates);
    const todayStr = getLocalDateKey();
    const weekDays = calculateCurrentWeek(activeSet, todayStr);

    const currentStreak = streakData.streak;
    const nextMilestone = STREAK_MILESTONES.find(m => m.targetDays > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    const prevTarget = STREAK_MILESTONES.filter(m => m.targetDays <= currentStreak).pop()?.targetDays || 0;
    const progressRange = Math.max(1, nextMilestone.targetDays - prevTarget);
    const progressPercent = Math.min(100, Math.max(0, Math.round(((currentStreak - prevTarget) / progressRange) * 100)));

    const recordCheckIn = useCallback(() => {
        const updated = readAndProcessStreak(userId);
        setStreakData(updated);
        window.dispatchEvent(new CustomEvent('finix_streak_updated'));
    }, [userId]);

    return {
        streak: currentStreak,
        longestStreak: streakData.longestStreak,
        isTodayActive: activeSet.has(todayStr),
        weekDays,
        nextMilestone,
        progressPercent,
        activeDates: streakData.activeDates,
        recordCheckIn,
    };
}
