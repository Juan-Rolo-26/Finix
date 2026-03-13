const withApiPrefix = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    if (path.startsWith('/api/')) {
        return path;
    }
    if (path.startsWith('/')) {
        return `/api${path}`;
    }
    return `/api/${path}`;
};

const authEndpoints = ['/api/admin/auth/login', '/api/admin/auth/verify-2fa', '/api/admin/auth/refresh'];

const isAuthEndpoint = (path: string) => authEndpoints.some((route) => path.startsWith(route));

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
    const response = await fetch('/api/admin/auth/refresh', {
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
