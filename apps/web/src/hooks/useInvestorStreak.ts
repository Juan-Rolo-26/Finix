import { useState, useEffect, useCallback, useMemo } from 'react';
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
    isPartOfCurrentStreak: boolean;
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
    version: 2;
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

/**
 * Computes unbroken consecutive days active backwards from anchorDateStr.
 */
export function computeConsecutiveStreak(activeDatesSet: Set<string>, anchorDateStr: string): number {
    if (!activeDatesSet.has(anchorDateStr)) return 0;
    let count = 1;
    const [y, m, d] = anchorDateStr.split('-').map(Number);
    const curDate = new Date(y, m - 1, d);
    while (true) {
        curDate.setDate(curDate.getDate() - 1);
        const prevKey = getLocalDateKey(curDate);
        if (activeDatesSet.has(prevKey)) {
            count += 1;
        } else {
            break;
        }
    }
    return count;
}

/**
 * Computes the historical longest consecutive streak across all recorded active dates.
 */
export function computeLongestStreak(activeDates: string[], currentStreak: number, existingLongest: number = 0): number {
    if (activeDates.length === 0) return Math.max(1, currentStreak, existingLongest);
    const sorted = Array.from(new Set(activeDates)).sort();
    let maxRun = Math.max(currentStreak, existingLongest, 1);
    let currentRun = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = diffCalendarDays(sorted[i - 1], sorted[i]);
        if (diff === 1) {
            currentRun += 1;
            if (currentRun > maxRun) maxRun = currentRun;
        } else if (diff > 1) {
            currentRun = 1;
        }
    }
    return Math.max(maxRun, currentStreak);
}

function getStorageKey(userId?: string | null): string {
    return userId ? `finix_streak_user_${userId}` : 'finix_streak_guest';
}

function sanitizeStreakData(rawObj: any, todayStr: string): StreakData {
    if (rawObj && rawObj.version === 2) {
        const activeDates: string[] = Array.isArray(rawObj.activeDates)
            ? (Array.from(new Set<string>(rawObj.activeDates.filter((d: any): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))))).sort()
            : [];
        if (!activeDates.includes(todayStr)) {
            activeDates.push(todayStr);
            activeDates.sort();
        }
        const set = new Set(activeDates);
        const streak = computeConsecutiveStreak(set, todayStr);
        const longestStreak = computeLongestStreak(activeDates, streak, typeof rawObj.longestStreak === 'number' ? rawObj.longestStreak : streak);
        return {
            version: 2,
            streak,
            longestStreak,
            lastActiveDate: todayStr,
            activeDates: activeDates.slice(-90),
        };
    }

    // Legacy unversioned data or corrupted mock data:
    // In legacy data, rawObj might have fake dates from the old `streak: 4` mock fallback.
    // If the streak broke, or if unversioned, only retain true contiguous activity ending at lastDate.
    let activeDates: string[] = [];
    let realChain = 1;
    const lastDate = typeof rawObj?.lastActiveDate === 'string' ? rawObj.lastActiveDate : todayStr;

    if (Array.isArray(rawObj?.activeDates) && rawObj.activeDates.length > 0) {
        const validDates: string[] = rawObj.activeDates.filter((d: any) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
        const set = new Set(validDates);
        realChain = computeConsecutiveStreak(set, lastDate);
        if (realChain > 1) {
            // Keep genuine contiguous chain
            const chainDates: string[] = [];
            const [y, m, d] = lastDate.split('-').map(Number);
            const anchor = new Date(y, m - 1, d);
            for (let i = 0; i < realChain; i++) {
                const cur = new Date(anchor);
                cur.setDate(anchor.getDate() - i);
                chainDates.unshift(getLocalDateKey(cur));
            }
            activeDates = chainDates;
        } else {
            // Fresh or broken legacy streak: start cleanly today
            activeDates = [todayStr];
        }
    } else {
        activeDates = [todayStr];
    }

    if (!activeDates.includes(todayStr)) {
        activeDates.push(todayStr);
        activeDates.sort();
    }

    const set = new Set(activeDates);
    const streak = computeConsecutiveStreak(set, todayStr);
    const legacyLongest = realChain > 1 && typeof rawObj?.longestStreak === 'number' ? rawObj.longestStreak : streak;
    const longestStreak = computeLongestStreak(activeDates, streak, legacyLongest);

    return {
        version: 2,
        streak,
        longestStreak,
        lastActiveDate: todayStr,
        activeDates: activeDates.slice(-90),
    };
}

function calculateCurrentWeek(activeDatesSet: Set<string>, todayStr: string, currentStreak: number, now: Date = new Date()): WeekDayStatus[] {
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

    // Compute streak active range: dates backwards from today for `currentStreak` days
    const streakDatesSet = new Set<string>();
    if (currentStreak > 0) {
        const [y, m, d] = todayStr.split('-').map(Number);
        const anchor = new Date(y, m - 1, d);
        for (let s = 0; s < currentStreak; s++) {
            const cur = new Date(anchor);
            cur.setDate(anchor.getDate() - s);
            streakDatesSet.add(getLocalDateKey(cur));
        }
    }

    return dayMeta.map((meta, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = getLocalDateKey(d);
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;
        const isFuture = dateStr > todayStr;
        const isActive = activeDatesSet.has(dateStr);
        const isPartOfCurrentStreak = streakDatesSet.has(dateStr);

        return {
            label: meta.label,
            fullLabel: meta.fullLabel,
            dateStr,
            dayNumber: d.getDate(),
            isToday,
            isPast,
            isFuture,
            isActive,
            isPartOfCurrentStreak,
        };
    });
}

function readAndProcessStreak(userId?: string | null): StreakData {
    const today = getLocalDateKey();
    if (typeof window === 'undefined') {
        return { version: 2, streak: 1, longestStreak: 1, lastActiveDate: today, activeDates: [today] };
    }

    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);

    // If new user session has no entry yet, check if there's a guest check-in from today to carry over
    if (!raw && userId) {
        const guestRaw = localStorage.getItem('finix_streak_guest');
        if (guestRaw) {
            try {
                const parsedGuest = JSON.parse(guestRaw);
                if (parsedGuest && parsedGuest.lastActiveDate === today) {
                    raw = guestRaw;
                    localStorage.removeItem('finix_streak_guest');
                }
            } catch { }
        }
    }

    // Also check legacy keys if no current key
    if (!raw) {
        const legacyUserKey = userId ? `finix_streak_${userId}` : null;
        if (legacyUserKey && localStorage.getItem(legacyUserKey)) {
            raw = localStorage.getItem(legacyUserKey);
            localStorage.removeItem(legacyUserKey);
        } else if (!userId && localStorage.getItem('finix_investor_streak')) {
            raw = localStorage.getItem('finix_investor_streak');
            localStorage.removeItem('finix_investor_streak');
        }
    }

    let parsed: any = null;
    if (raw) {
        try {
            parsed = JSON.parse(raw);
        } catch { }
    }

    const processed = sanitizeStreakData(parsed, today);

    try {
        localStorage.setItem(key, JSON.stringify(processed));
        // Remove global legacy key to prevent data leaks between different users
        localStorage.removeItem('finix_investor_streak');
    } catch { }

    return processed;
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
            if (e.key === getStorageKey(userId) || e.key === 'finix_streak_updated') {
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

    const activeSet = useMemo(() => new Set(streakData.activeDates), [streakData.activeDates]);
    const todayStr = useMemo(() => getLocalDateKey(), []);
    const weekDays = useMemo(() => calculateCurrentWeek(activeSet, todayStr, streakData.streak), [activeSet, todayStr, streakData.streak]);

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
