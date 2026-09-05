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

function persistToken(token: string | null) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

function persistUser(user: User | null) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
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

export const useAuthStore = create<AuthState>((set) => ({
    token: persistedToken,
    user: JSON.parse(localStorage.getItem('user') || 'null'),

    login: (token, user) => {
        persistToken(token);
        persistUser(user);
        set({ token, user });
    },

    updateUser: (patch) => {
        const currentRaw = localStorage.getItem('user');
        const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
        const nextUser = currentUser ? { ...currentUser, ...patch } : patch;
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
                    persistUser(user);
                    set({ token: existingToken, user });

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
            persistUser(user);
            set({ token: accessToken, user });

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
        } catch (error) {
            // Backend is unreachable (timeout, network error, etc.)
            // Fall back to building a minimal user from the Supabase session
            // so the user stays logged in rather than being kicked out.
            console.warn('[AuthStore] Backend sync failed, using Supabase session fallback:', error);
            const fallbackUser = buildFallbackUser(session);
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
