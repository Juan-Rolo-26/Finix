const withApiPrefix = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const baseUrl = import.meta.env.VITE_ADMIN_API_PROXY_TARGET || '';
    let normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (!baseUrl) {
        return normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
    }

    if (baseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
        normalizedPath = normalizedPath.substring(4);
    }

    return `${baseUrl.replace(/\/+$/, '')}/${normalizedPath.replace(/^\/+/, '')}`;
};

const authEndpoints = ['/admin/auth/login', '/admin/auth/verify-error', '/admin/auth/verify-email', '/admin/auth/verify-2fa', '/admin/auth/refresh'];

const isAuthEndpoint = (path: string) => authEndpoints.some((route) => path.includes(route));

const buildInit = (init?: RequestInit): RequestInit => {
    const headers = new Headers(init?.headers || {});
    if (init?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return {
        ...init,
        headers,
        credentials: 'include',
    };
};

async function tryRefreshSession() {
    const url = withApiPrefix('/admin/auth/refresh');
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
    });

    return response.ok;
}

export async function adminFetch(path: string, init?: RequestInit) {
    const url = withApiPrefix(path);
    let response = await fetch(url, buildInit(init));

    if (response.status === 401 && !isAuthEndpoint(url)) {
        const refreshed = await tryRefreshSession();
        if (refreshed) {
            response = await fetch(url, buildInit(init));
        } else if (typeof window !== 'undefined') {
            window.location.assign('/login');
        }
    }

    return response;
}

export async function readAdminErrorMessage(response: Response, fallback: string) {
    const data = await response.json().catch(() => null);

    if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
    }

    if (Array.isArray(data?.message)) {
        const first = data.message.find((value: unknown) => typeof value === 'string' && value.trim());
        if (typeof first === 'string') {
            return first;
        }
    }

    return fallback;
}
