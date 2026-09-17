const withApiPrefix = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    let baseUrl = import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_ADMIN_API_PROXY_TARGET || '';

    // En navegador en producción (o en admin.finixarg.com), usamos '/api'
    // aprovechando el proxy de Nginx (o el proxy de Vite en desarrollo).
    // Esto garantiza que las cookies de sesión (2FA) sean 100% Same-Origin.
    if (!baseUrl && typeof window !== 'undefined') {
        baseUrl = '/api';
    }

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

// Timeout máximo por request al admin API (25s).
// Evita que los fetches queden colgados indefinidamente si la API no responde.
const ADMIN_FETCH_TIMEOUT_MS = 25_000;

function buildAbortSignal(): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ADMIN_FETCH_TIMEOUT_MS);
    return controller.signal;
}

async function tryRefreshSession(): Promise<boolean> {
    try {
        const url = withApiPrefix('/admin/auth/refresh');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({}),
            signal: buildAbortSignal(),
        });
        return response.ok;
    } catch {
        // Error de red o timeout en el refresh → sesión inválida
        return false;
    }
}

export async function adminFetch(path: string, init?: RequestInit) {
    const url = withApiPrefix(path);

    let response: Response;
    try {
        response = await fetch(url, { ...buildInit(init), signal: buildAbortSignal() });
    } catch (err: any) {
        // Error de red o timeout → lanzamos un mensaje legible
        const isTimeout = err?.name === 'AbortError';
        throw new Error(isTimeout ? 'La solicitud tardó demasiado. Verificá la conexión con la API.' : 'No se pudo conectar con la API.');
    }

    if (response.status === 401 && !isAuthEndpoint(url)) {
        const refreshed = await tryRefreshSession();
        if (refreshed) {
            try {
                response = await fetch(url, { ...buildInit(init), signal: buildAbortSignal() });
            } catch (err: any) {
                const isTimeout = err?.name === 'AbortError';
                throw new Error(isTimeout ? 'La solicitud tardó demasiado. Verificá la conexión con la API.' : 'No se pudo conectar con la API.');
            }
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
