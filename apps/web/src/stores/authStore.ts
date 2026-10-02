import { create } from 'zustand';
import { User } from '@finix/shared';
import { supabase } from '@/lib/supabase';
import { apiFetch, getAccessToken, refreshAccessToken, setAccessToken } from '@/lib/api';
import { usePreferencesStore } from './preferencesStore';
import { isFreeAccessEnabled } from './platformAccessStore';
interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User, refreshToken?: string) => void;
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

/** The provider token is only a bootstrap credential. Once the API has issued
 * a Finix token, Supabase token refresh events must never replace it. */
function isFinixApiToken(token: string | null | undefined) {
    if (!token || typeof window === 'undefined') return false;
    try {
        const payload = token.split('.')[1];
        if (!payload) return false;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
        return decoded?.iss === 'finix-api';
    } catch {
        return false;
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
    // This path is used when Supabase restored a Google/OAuth session. Call
    // sync-user deliberately instead of only reading /auth/me: the backend
    // uses this request to issue Finix's persistent HttpOnly refresh cookie.
    return withTimeout(
        apiFetch('/auth/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(username ? { username } : {}),
        }),
        BACKEND_TIMEOUT_MS
    );
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

const initialToken = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('accessToken') || null)
    : null;
if (initialToken) {
    setAccessToken(initialToken);
}

const initialUser = enhanceUser(
    typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || 'null')
        : null
);
if (initialUser) {
    persistUser(initialUser);
}

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
        await supabase.auth.signOut();
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
            let session = null;
            try {
                const result = await supabase.auth.getSession();
                session = result.data.session;
            } catch {
                // The independent Finix session can still be restored by its cookie.
            }

            try {
                // A previous Supabase refresh may have overwritten the Finix
                // access token. Exchange the saved Finix refresh token through
                // apiFetch's single-flight refresh path before hitting private APIs.
                if (existingRefreshToken && !isFinixApiToken(existingToken)) {
                    const restored = await refreshAccessToken();
                    if (!restored) {
                        if (persistedUser) set({ token: existingToken, user: persistedUser });
                        return persistedUser;
                    }
                }

                const hasProviderSession = Boolean(session);
                const shouldRestoreFinixSession = isFinixApiToken(getAccessToken()) || !hasProviderSession;

                if (shouldRestoreFinixSession) {
                    // A 401 here automatically attempts the shared refresh flow,
                    // including the HttpOnly cookie for a new browser profile.
                    const existingSessionRes = await apiFetch('/auth/me');
                    if (existingSessionRes.ok) {
                        const user: User = await existingSessionRes.json();
                        const enhanced = enhanceUser(user);
                        persistUser(enhanced);
                        const currentToken = getAccessToken() || existingToken;
                        if (currentToken) persistToken(currentToken);
                        set({ token: currentToken, user: enhanced });

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
                    }
                }

                // A provider session without a Finix refresh token is a first
                // login (or legacy OAuth session): exchange it for the API's
                // persistent session, even if Supabase /auth/me would accept it.
                if (session && !existingRefreshToken && !isFinixApiToken(existingToken)) {
                    const accessToken = session.access_token;
                    persistToken(accessToken);
                    let username = session.user.user_metadata?.username as string | undefined;
                    const pendingUsername = localStorage.getItem('pendingUsername');
                    if (pendingUsername) {
                        username = pendingUsername;
                        localStorage.removeItem('pendingUsername');
                        try {
                            await supabase.auth.updateUser({ data: { username } });
                        } catch {
                            // Ignore metadata error if Supabase throws.
                        }
                    }

                    const res = await syncBackendUser(username);

                    if (!res.ok) throw new Error('Backend sync failed');

                    const syncData = await res.json();
                    const enhanced = enhanceUser(syncData);
                    persistUser(enhanced);
                    if (syncData.token) persistToken(syncData.token);
                    if (syncData.refreshToken) persistRefreshToken(syncData.refreshToken);
                    set({ token: syncData.token || accessToken, user: enhanced });

                    const { language, theme, currency } = syncData as any;
                    if (language || theme || currency) {
                        usePreferencesStore.getState().updatePreferences({
                            ...(language && { language }),
                            ...(theme && { theme }),
                            ...(currency && { currency }),
                        });
                        if (theme) usePreferencesStore.getState().setTheme(theme);
                    }
                    return enhanced;
                }

                if (session) {
                    const fallbackUser = enhanceUser(buildFallbackUser(session));
                    persistUser(fallbackUser);
                    set({ token: getAccessToken() || existingToken, user: fallbackUser });
                    return fallbackUser;
                }

                if (persistedUser) {
                    set({ token: getAccessToken() || existingToken, user: persistedUser });
                    return persistedUser;
                }
                return null;
            } catch (error) {
                console.warn('[AuthStore] Backend session sync failed:', error);
                if (session && !existingRefreshToken && !isFinixApiToken(existingToken)) {
                    const fallbackUser = enhanceUser(buildFallbackUser(session));
                    persistUser(fallbackUser);
                    set({ token: getAccessToken() || session.access_token, user: fallbackUser });
                    return fallbackUser;
                }
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

// Supabase is only a bootstrap identity provider. Never overwrite an issued
// Finix API token; private backend endpoints use its persistent session id.
supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) {
        const hasFinixRefreshToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('refreshToken'));
        if (!hasFinixRefreshToken) {
            persistToken(session.access_token);
            useAuthStore.setState({ token: session.access_token });
        }
    }
});
