const defaultBases = Array.from(
    new Set(
        [
            '/api',
            import.meta.env.VITE_API_URL,
            typeof window !== 'undefined' ? `${window.location.origin}/api` : null,
            import.meta.env.DEV ? 'http://localhost:3010/api' : null,
        ].filter(Boolean)
    )
) as string[];

let activeBase = defaultBases[0];
let runtimeAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    runtimeAccessToken = token;
};

export const getAccessToken = () => runtimeAccessToken;

const buildUrl = (base: string, path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base.replace(/\/$/, '')}${normalized}`;
};

const SESSION_AUTH_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot',
    '/auth/refresh',
    '/auth/logout',
];

const isSessionAuthEndpoint = (path: string) => {
    const normalizedPath = path.toLowerCase();
    return SESSION_AUTH_ENDPOINTS.some((endpoint) => normalizedPath.includes(endpoint));
};

const persistRefreshedSession = (data: any) => {
    if (typeof window === 'undefined' || !data?.token) return false;
    setAccessToken(data.token);
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return true;
};

let refreshPromise: Promise<boolean> | null = null;

const tryRefreshSession = async (base: string) => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const response = await fetch(buildUrl(base, '/auth/refresh'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
            });
            if (!response.ok) return false;
            return persistRefreshedSession(await response.json().catch(() => null));
        } catch {
            return false;
        }
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
};

export const apiUrl = (path: string) => buildUrl(activeBase ?? '', path);

import { handleMockNews } from './mockNews';

// Limpieza de mocks legacy del navegador
if (typeof window !== 'undefined') {
    localStorage.removeItem('mockPortfolios');
    localStorage.removeItem('hasSeededPortfolios');
}

export const apiFetch = async (path: string, init?: RequestInit) => {
    // Portfolios, Users y Market van 100% al backend NestJS sin interceptores de mocks
    if (path.startsWith('/news')) {
        const newsResponse = await handleMockNews(path, init);
        if (newsResponse) return newsResponse;
    }

    const withAuth = (requestInit?: RequestInit, token = getAccessToken()) => {
        const enhancedInit = { ...requestInit, credentials: 'include' as RequestCredentials };
        const headers = new Headers(enhancedInit.headers || {});

        // Never force JSON headers on multipart requests. The browser must set
        // Content-Type itself so it can include the FormData boundary; without
        // it Multer receives an empty body and reports "No content provided".
        if (enhancedInit.body instanceof FormData) {
            headers.delete('Content-Type');
            headers.delete('Content-Length');
        }

        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (!headers.has('Cache-Control')) {
            headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        if (!headers.has('Pragma')) {
            headers.set('Pragma', 'no-cache');
        }
        return {
            ...enhancedInit,
            headers,
            cache: (requestInit?.cache || 'no-store') as RequestCache,
        };
    };

    const candidates = activeBase
        ? [activeBase, ...defaultBases.filter((base) => base !== activeBase)]
        : [...defaultBases];

    let lastResponse: Response | null = null;

    let lastError: unknown = null;

    let didRefresh = false;

    for (const base of candidates) {
        let response: Response;
        try {
            response = await fetch(buildUrl(base, path), withAuth(init));
        } catch (error) {
            lastError = error;
            continue;
        }

        if (response.status === 401 && !didRefresh && !isSessionAuthEndpoint(path)) {
            didRefresh = await tryRefreshSession(base);
            if (didRefresh) {
                activeBase = base;
                try {
                    response = await fetch(buildUrl(base, path), withAuth(init, getAccessToken()));
                } catch (error) {
                    lastError = error;
                    continue;
                }
            }
        }

        if (response.status !== 404) {
            const contentType = response.headers.get('content-type') || '';
            // If the response is HTML, it's very likely the Cloudflare/Vite SPA fallback catching an API request
            if (contentType.includes('text/html')) {
                lastResponse = response;
                continue;
            }

            activeBase = base;
            // A failed request must not log the user out. The persistent
            // session is closed only by the explicit logout action; keeping
            // the stored profile also prevents transient API failures from
            // sending the user to the login screen.
            return response;
        }

        lastResponse = response;
        try {
            const data = await response.clone().json();
            if (typeof data?.message === 'string' && data.message.startsWith('Cannot ')) {
                continue;
            }
        } catch {
            // If body isn't JSON, treat as not found route and try next base.
            continue;
        }

        activeBase = base;
        return response;
    }

    if (lastResponse) {
        return lastResponse;
    }
    if (lastError) {
        throw lastError;
    }
    return fetch(buildUrl(defaultBases[0], path), withAuth(init));
};
