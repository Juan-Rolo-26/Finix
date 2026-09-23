import { create } from 'zustand';
import { User } from '@finix/shared';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { usePreferencesStore } from './preferencesStore';
interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    updateUser: (patch: Partial<User>) => void;
    logout: () => void;
    /** Restore the current Finix or Supabase-backed session */
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
    
    // Juan26-08 is the platform owner and always has full PRO & Admin privileges permanently
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

function enhanceUser(user: any): any {
    if (!user) return null;
    if (isJuanUser(user)) {
        const isFree = user.plan === 'FREE' || user.isPro === false;
        const isNotCreator = user.isCreator === false;
        return {
            ...user,
            role: user.role || 'ADMIN',
            plan: isFree ? 'FREE' : (user.plan || 'PRO'),
            accountType: isFree ? (isNotCreator ? 'BASIC' : 'CREATOR') : (user.accountType || 'PRO'),
            subscriptionStatus: isFree && isNotCreator ? (user.subscriptionStatus || 'CANCELED') : (user.subscriptionStatus || 'ACTIVE'),
            isPro: !isFree,
            isCreator: !isNotCreator,
            isVerified: true,
        };
    }
    return user;
}

function persistToken(token: string | null) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

function persistUser(user: User | null) {
    const enhanced = enhanceUser(user);
    if (enhanced) {
        localStorage.setItem('user', JSON.stringify(enhanced));
    } else {
        localStorage.removeItem('user');
    }
}

const BACKEND_TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout')), ms)
        ),
    ]);
}

async function syncBackendUser(username?: string) {
    let response = await withTimeout(apiFetch('/auth/me'), BACKEND_TIMEOUT_MS);

    if (response.status === 401) {
        response = await withTimeout(
            apiFetch('/auth/sync-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(username ? { username } : {}),
            }),
            BACKEND_TIMEOUT_MS
        );
    }

    return response;
}

function buildFallbackUser(session: { access_token: string; user: { id: string; email?: string; user_metadata?: Record<string, unknown> } }): import('@finix/shared').User {
    const meta = session.user.user_metadata ?? {};
    return {
        id: session.user.id,
        email: session.user.email ?? '',
        username: (meta.username as string | undefined) ?? (session.user.email ?? '').split('@')[0],
        onboardingCompleted: false,
    } as import('@finix/shared').User;
}

const persistedToken = localStorage.getItem('token');
const initialUser = enhanceUser(JSON.parse(localStorage.getItem('user') || 'null'));
if (initialUser) {
    persistUser(initialUser);
}

export const useAuthStore = create<AuthState>((set) => ({
    token: persistedToken,
    user: initialUser,

    login: (token, user) => {
        const enhanced = enhanceUser(user);
        persistToken(token);
        persistUser(enhanced);
        set({ token, user: enhanced });
    },

    updateUser: (patch) => {
        const currentRaw = localStorage.getItem('user');
        const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
        const nextUser = enhanceUser(currentUser ? { ...currentUser, ...patch } : patch);
        persistUser(nextUser as User);
        set({ user: nextUser as User });
    },

    logout: async () => {
        await supabase.auth.signOut();
        persistToken(null);
        persistUser(null);
        set({ token: null, user: null });
    },

    syncFromSession: async () => {
        const existingToken = localStorage.getItem('token');
        if (existingToken) {
            persistToken(existingToken);
            try {
                const existingSessionRes = await apiFetch('/auth/me');
                if (existingSessionRes.ok) {
                    const user: User = await existingSessionRes.json();
                    const enhanced = enhanceUser(user);
                    persistUser(enhanced);
                    set({ token: existingToken, user: enhanced });

                    // Sync preferences globally
                    const { language, theme, currency } = user as any;
                    if (language || theme || currency) {
                        usePreferencesStore.getState().updatePreferences({
                            ...(language && { language }),
                            ...(theme && { theme }),
                            ...(currency && { currency }),
                        });
                        if (theme) usePreferencesStore.getState().setTheme(theme);
                    }

                    return user;
                }
            } catch {
                // Fall through to Supabase session restoration.
            }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            persistToken(null);
            persistUser(null);
            set({ token: null, user: null });
            return null;
        }

        const accessToken = session.access_token;
        persistToken(accessToken);

        try {
            let username = session.user.user_metadata?.username as string | undefined;
            const pendingUsername = localStorage.getItem('pendingUsername');
            if (pendingUsername) {
                username = pendingUsername;
                localStorage.removeItem('pendingUsername');
                try {
                    await supabase.auth.updateUser({ data: { username } });
                } catch (e) {
                    // Ignore metadata error if Supabase throws
                }
            }

            const res = await syncBackendUser(username);

            if (!res.ok) {
                throw new Error('Backend sync failed');
            }

            const user: User = await res.json();
            const enhanced = enhanceUser(user);
            persistUser(enhanced);
            set({ token: accessToken, user: enhanced });

            // Sync preferences globally
            const { language, theme, currency } = user as any;
            if (language || theme || currency) {
                usePreferencesStore.getState().updatePreferences({
                    ...(language && { language }),
                    ...(theme && { theme }),
                    ...(currency && { currency }),
                });
                if (theme) usePreferencesStore.getState().setTheme(theme);
            }

            return enhanced;
        } catch (error) {
            // Backend is unreachable (timeout, network error, etc.)
            // Fall back to building a minimal user from the Supabase session
            // so the user stays logged in rather than being kicked out.
            console.warn('[AuthStore] Backend sync failed, using Supabase session fallback:', error);
            const fallbackUser = enhanceUser(buildFallbackUser(session));
            persistUser(fallbackUser);
            set({ token: accessToken, user: fallbackUser });
            return fallbackUser;
        }
    },
}));

// Keep localStorage.token in sync whenever Supabase refreshes the access token
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && session) {
        persistToken(session.access_token);
        useAuthStore.setState({ token: session.access_token });
    }
    if (event === 'SIGNED_OUT') {
        persistToken(null);
        persistUser(null);
        useAuthStore.setState({ token: null, user: null });
    }
});
