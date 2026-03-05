const defaultBases = Array.from(
    new Set(
        [
            '/api',
            import.meta.env.VITE_API_URL,
            'http://localhost:3001/api',
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
    localStorage.removeItem('demo_mode');

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

    // Evita interceptar errores de login/register.
    const normalizedPath = path.toLowerCase();
    if (
        normalizedPath.includes('/auth/login') ||
        normalizedPath.includes('/auth/register') ||
        normalizedPath.includes('/auth/forgot')
    ) {
        return false;
    }
    return true;
};

export const apiUrl = (path: string) => buildUrl(activeBase ?? '', path);

export const apiFetch = async (path: string, init?: RequestInit) => {
    const authToken = localStorage.getItem('token');
    const withAuth = (requestInit?: RequestInit) => {
        if (!authToken) {
            return requestInit;
        }
        const headers = new Headers(requestInit?.headers || {});
        if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${authToken}`);
        }
        return { ...requestInit, headers };
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
