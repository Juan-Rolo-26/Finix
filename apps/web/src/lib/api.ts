const defaultBases = Array.from(
    new Set(
        [
            '/api',
            import.meta.env.VITE_API_URL,
            typeof window !== 'undefined' ? `${window.location.origin}/api` : null,
            import.meta.env.DEV ? 'http://localhost:3001/api' : null,
        ].filter(Boolean)
    )
) as string[];

let activeBase = defaultBases[0];

const buildUrl = (base: string, path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base.replace(/\/$/, '')}${normalized}`;
};

const clearAuthAndRedirect = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (window.location.pathname !== '/') {
        const target = '/?reason=session-expired';
        window.location.assign(target);
    }
};

const shouldAutoLogoutOnUnauthorized = (path: string, status: number) => {
    if (status !== 401) return false;
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Evita invalidar la sesión durante el bootstrap de autenticación.
    const normalizedPath = path.toLowerCase();
    if (
        normalizedPath.includes('/auth/login') ||
        normalizedPath.includes('/auth/register') ||
        normalizedPath.includes('/auth/forgot') ||
        normalizedPath.includes('/auth/me') ||
        normalizedPath.includes('/auth/sync-user')
    ) {
        return false;
    }
    return true;
};

export const apiUrl = (path: string) => buildUrl(activeBase ?? '', path);

import { handleMockRequest } from './mockApi';
import { handleMockMarket } from './mockMarket';
import { handleMockNews } from './mockNews';
import { handleMockPosts } from './mockPosts';
import { handleMockUsers } from './mockUsers';

export const apiFetch = async (path: string, init?: RequestInit) => {
    if (path.startsWith('/portfolios')) {
        const mockResponse = await handleMockRequest(path, init);
        if (mockResponse) return mockResponse;
    }
    if (path.startsWith('/users')) {
        const usersResponse = await handleMockUsers(path, init);
        if (usersResponse) return usersResponse;
    }
    if (path.startsWith('/posts')) {
        const postsResponse = await handleMockPosts(path, init);
        if (postsResponse) return postsResponse;
    }
    if (path.startsWith('/market')) {
        const marketResponse = await handleMockMarket(path, init);
        if (marketResponse) return marketResponse;
    }
    if (path.startsWith('/news')) {
        const newsResponse = await handleMockNews(path, init);
        if (newsResponse) return newsResponse;
    }

    const authToken = localStorage.getItem('token');
    const withAuth = (requestInit?: RequestInit) => {
        const enhancedInit = { ...requestInit, credentials: 'include' as RequestCredentials };
        if (!authToken) {
            return enhancedInit;
        }
        const headers = new Headers(enhancedInit.headers || {});
        if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${authToken}`);
        }
        return { ...enhancedInit, headers };
    };

    const candidates = activeBase
        ? [activeBase, ...defaultBases.filter((base) => base !== activeBase)]
        : [...defaultBases];

    let lastResponse: Response | null = null;

    let lastError: unknown = null;

    for (const base of candidates) {
        let response: Response;
        try {
            response = await fetch(buildUrl(base, path), withAuth(init));
        } catch (error) {
            lastError = error;
            continue;
        }

        if (response.status !== 404) {
            const contentType = response.headers.get('content-type') || '';
            // If the response is HTML, it's very likely the Cloudflare/Vite SPA fallback catching an API request
            if (contentType.includes('text/html')) {
                lastResponse = response;
                continue;
            }

            activeBase = base;
            if (shouldAutoLogoutOnUnauthorized(path, response.status)) {
                clearAuthAndRedirect();
            }
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
