import { create } from 'zustand';
import { User } from '@finix/shared';

import { apiFetch, getAccessToken, refreshAccessToken, setAccessToken } from '@/lib/api';
import { usePreferencesStore } from './preferencesStore';
import { isFreeAccessEnabled } from './platformAccessStore';
interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User, refreshToken?: string) => void;
    updateUser: (patch: Partial<User>) => void;
    logout: () => void;
    /** Restore the current Finix session */
    syncFromSession: () => Promise<User | null>;
}

export function isJuanUser(user: any): boolean {
    let candidate = user;
    if (!candidate && typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('user');
            if (raw) candidate = JSON.parse(raw);
        } catch { }
    }
    if (!candidate) return false;
    const username = String(candidate.username || '').trim().toLowerCase();
    const email = String(candidate.email || '').trim().toLowerCase();
    const name = String(candidate.name || '').trim().toLowerCase();
    
    // Legacy owner identity helper. Effective PRO access can still be revoked
    // explicitly by an administrator through proAccessOverride.
    return (
        username === 'juan26-08' ||
        username === 'juan26_08' ||
        username === 'juan2608' ||
        username.includes('juan26') ||
        email.includes('juanpablorolo') ||
        (email.includes('juan') && email.includes('26')) ||
        name.includes('juan26') ||
        name.includes('juan pablo')
    );
}

export function isProUser(user: any): boolean {
    let candidate = user;
    if (!candidate && typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('user');
            if (raw) candidate = JSON.parse(raw);
        } catch { }
    }
    if (!candidate) return false;
    if (isFreeAccessEnabled()) return true;
    if (candidate.proAccessOverride === true) return true;
    if (candidate.proAccessOverride === false) return false;
    if (candidate.plan === 'FREE' || candidate.isPro === false || candidate.subscriptionStatus === 'CANCELED') {
        return false;
    }
    if (isJuanUser(candidate)) return true;

    const role = String(candidate.role || '').toUpperCase();
    const plan = String(candidate.plan || '').toUpperCase();
    const accountType = String(candidate.accountType || '').toUpperCase();
    const subStatus = String(candidate.subscriptionStatus || '').toUpperCase();
    return Boolean(
        candidate.isPro ||
        candidate.subscriptionTier === 'pro' ||
        role === 'ADMIN' ||
        role === 'SUPER_ADMIN' ||
        plan === 'PRO' ||
        accountType === 'PRO' ||
        subStatus === 'ACTIVE'
    );
}

export function isCreatorUser(user: any): boolean {
    if (!user) return false;
    if (isFreeAccessEnabled()) return true;
    if (user.proAccessOverride === false) return false;
    if (user.isCreator === false) return false;
    if (isJuanUser(user)) return true;
    const role = String(user.role || '').toUpperCase();
    const plan = String(user.plan || '').toUpperCase();
    const accountType = String(user.accountType || '').toUpperCase();
    return Boolean(
        user.isCreator ||
        role === 'CREATOR' ||
        role === 'ADMIN' ||
        role === 'SUPER_ADMIN' ||
        plan === 'CREATOR' ||
        plan === 'PRO_CREATOR' ||
        accountType === 'CREATOR'
    );
}

/** Access to the Communities section requires an active Finix PRO-family plan. */
export function hasCommunityAccess(user: any): boolean {
    if (!user) return false;
    if (isFreeAccessEnabled()) return true;
    if (user.proAccessOverride === false) return false;
    if (user.proAccessOverride === true) return true;
    if (isJuanUser(user)) return true;

    const role = String(user.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    const plan = String(user.plan || '').toUpperCase();
    const accountType = String(user.accountType || '').toUpperCase();
    const status = String(user.subscriptionStatus || '').toUpperCase();

    return status === 'ACTIVE' && (
        plan === 'PRO' ||
        plan === 'CREATOR' ||
        plan === 'PRO_CREATOR' ||
        accountType === 'PRO' ||
        accountType === 'CREATOR' ||
        Boolean(user.isCreator)
    );
}

/** Only an active Creator-family plan can create or administer communities. */
export function hasCommunityCreatorAccess(user: any): boolean {
    if (!hasCommunityAccess(user)) return false;
    if (isFreeAccessEnabled()) return true;
    if (isJuanUser(user)) return true;

    const role = String(user.role || '').toUpperCase();
    const plan = String(user.plan || '').toUpperCase();
    const accountType = String(user.accountType || '').toUpperCase();

    return (
        role === 'CREATOR' ||
        plan === 'CREATOR' ||
        plan === 'PRO_CREATOR' ||
        accountType === 'CREATOR' ||
        Boolean(user.isCreator)
    );
}

function enhanceUser(user: any): any {
    if (!user) return null;
    if (isJuanUser(user)) {
        const isFree = user.proAccessOverride === false || user.plan === 'FREE' || user.isPro === false;
        const isNotCreator = user.isCreator === false;
        return {
            ...user,
            role: user.role || 'ADMIN',
            plan: isFree ? 'FREE' : (user.plan || 'PRO'),
            accountType: isFree ? (isNotCreator ? 'BASIC' : 'CREATOR') : (user.accountType || 'PRO'),
            subscriptionStatus: isFree && isNotCreator ? (user.subscriptionStatus || 'CANCELED') : (user.subscriptionStatus || 'ACTIVE'),
            isPro: user.proAccessOverride === true ? true : !isFree,
            isCreator: !isNotCreator,
            isVerified: Boolean(user.isVerified),
            proAccessOverride: user.proAccessOverride ?? null,
        };
    }
    return user;
}

function persistToken(token: string | null) {
    setAccessToken(token);
}

function persistRefreshToken(refreshToken: string | null) {
    if (typeof window !== 'undefined') {
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        } else {
            localStorage.removeItem('refreshToken');
        }
    }
}

function persistUser(user: User | null) {
    const enhanced = enhanceUser(user);
    if (typeof window !== 'undefined') {
        if (enhanced) {
            localStorage.setItem('user', JSON.stringify(enhanced));
        } else {
            localStorage.removeItem('user');
        }
    }
}

let sessionSyncPromise: Promise<User | null> | null = null;

const initialToken = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('accessToken') || null)
    : null;
if (initialToken) setAccessToken(initialToken);
const initialUser = enhanceUser(typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null') : null);

export const useAuthStore = create<AuthState>((set) => ({
    token: initialToken,
    user: initialUser,

    login: (token, user, refreshToken) => {
        const enhanced = enhanceUser(user);
        persistToken(token);
        if (refreshToken) {
            persistRefreshToken(refreshToken);
        }
        persistUser(enhanced);
        set({ token, user: enhanced });
    },

    updateUser: (patch) => {
        const currentRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
        const nextUser = enhanceUser(currentUser ? { ...currentUser, ...patch } : patch);
        persistUser(nextUser as User);
        set({ user: nextUser as User });
    },

    logout: async () => {
        try {
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : undefined;
            await apiFetch('/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refreshToken ? { refreshToken } : {}),
            });
        } catch {
            // The local session is still cleared if the API is temporarily unavailable.
        }
        persistToken(null);
        persistRefreshToken(null);
        persistUser(null);
        set({ token: null, user: null });
    },

    syncFromSession: async (): Promise<User | null> => {
        if (sessionSyncPromise) return sessionSyncPromise;

        sessionSyncPromise = (async (): Promise<User | null> => {
            const existingToken = getAccessToken();
            const existingRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            const persistedUser = enhanceUser(JSON.parse(localStorage.getItem('user') || 'null')) as User | null;
            try {
                // Google and password login both use Finix's HttpOnly refresh cookie.
                if (existingRefreshToken && !existingToken) await refreshAccessToken();
                const response = await apiFetch('/auth/me');
                if (!response.ok) {
                    if (response.status === 401) {
                        persistToken(null);
                        persistRefreshToken(null);
                        persistUser(null);
                        set({ token: null, user: null });
                        return null;
                    }
                    throw new Error('No se pudo recuperar la sesión');
                }
                const user: User = await response.json();
                const enhanced = enhanceUser(user);
                persistUser(enhanced);
                set({ token: getAccessToken(), user: enhanced });
                const { language, theme, currency } = user as any;
                if (language || theme || currency) {
                    usePreferencesStore.getState().updatePreferences({
                        ...(language && { language }), ...(theme && { theme }), ...(currency && { currency }),
                    });
                    if (theme) usePreferencesStore.getState().setTheme(theme);
                }
                return enhanced;
            } catch {
                // Keep the UI during temporary network failures; the API still checks authorization.
                if (persistedUser) set({ token: getAccessToken() || existingToken, user: persistedUser });
                return persistedUser;
            }
        })();

        try {
            return await sessionSyncPromise;
        } finally {
            sessionSyncPromise = null;
        }
    },
}));
