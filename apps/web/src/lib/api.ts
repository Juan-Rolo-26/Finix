const candidates = ['/api', import.meta.env.VITE_API_URL, import.meta.env.DEV ? 'http://localhost:3010/api' : null].filter(Boolean) as string[];
const defaultBases = Array.from(new Map(candidates.map(base => [typeof window === 'undefined' ? base : new URL(base, window.location.origin).href, base])).values());

async function fetchWithDeadline(url: string, init?: RequestInit) {
    const controller = new AbortController();
    const abort = () => controller.abort(init?.signal?.reason);
    if (init?.signal?.aborted) abort();
    else init?.signal?.addEventListener('abort', abort, { once: true });
    const timeout = window.setTimeout(() => controller.abort(new DOMException('La solicitud tardó demasiado.', 'TimeoutError')), init?.body instanceof FormData ? 120000 : 25000);
    try { return await fetch(url, { ...init, signal: controller.signal }); }
    finally { window.clearTimeout(timeout); init?.signal?.removeEventListener('abort', abort); }
}

let activeBase = defaultBases[0];
let runtimeAccessToken: string | null = (typeof window !== 'undefined')
    ? (localStorage.getItem('token') || localStorage.getItem('accessToken') || null)
    : null;

export const setAccessToken = (token: string | null) => {
    runtimeAccessToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
        }
    }
};

export const getAccessToken = () => {
    if (!runtimeAccessToken && typeof window !== 'undefined') {
        runtimeAccessToken = localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
    }
    return runtimeAccessToken;
};

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
    if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
    }
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
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            const response = await fetch(buildUrl(base, '/auth/refresh'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refreshToken ? { refreshToken } : {}),
                cache: 'no-store',
                signal: AbortSignal.timeout(10000),
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

/** Restore the persistent Finix session through the same single-flight path
 * used by apiFetch after a 401. Keeping one shared refresh prevents parallel
 * app startup requests from rotating the same refresh token twice. */
export const refreshAccessToken = () => tryRefreshSession(activeBase ?? defaultBases[0]);

export const apiUrl = (path: string) => buildUrl(activeBase ?? '', path);



// Limpieza de mocks legacy del navegador
if (typeof window !== 'undefined') {
    localStorage.removeItem('mockPortfolios');
    localStorage.removeItem('hasSeededPortfolios');
}

export const apiFetch = async (path: string, init?: RequestInit) => {
    // Portfolios, Users y Market van 100% al backend NestJS sin interceptores de mocks
    // Demo articles must never replace real backend responses in production.
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true'
        && path.startsWith('/news') && !path.startsWith('/news/slots')) {
        const { handleMockNews } = await import('./mockNews');
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
            response = await fetchWithDeadline(buildUrl(base, path), withAuth(init));
        } catch (error) {
            if (init?.signal?.aborted) throw error;
            lastError = error;
            continue;
        }

        if (response.status === 401 && !didRefresh && !isSessionAuthEndpoint(path)) {
            didRefresh = await tryRefreshSession(base);
            if (didRefresh) {
                activeBase = base;
                try {
                    response = await fetchWithDeadline(buildUrl(base, path), withAuth(init, getAccessToken()));
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
    return fetchWithDeadline(buildUrl(defaultBases[0], path), withAuth(init));
};
