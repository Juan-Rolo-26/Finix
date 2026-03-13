const LOCAL_UPLOAD_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

// Rewrite a /uploads/... path to /api/uploads/... so it flows through
// the existing /api proxy in both Vite (dev) and nginx (production).
function rewriteUploadsPath(pathname: string): string {
    if (pathname.startsWith('/uploads/')) {
        return pathname.replace(/^\/uploads\//, '/api/uploads/');
    }
    return pathname;
}

export function resolveMediaUrl(value?: string | null) {
    if (typeof value !== 'string') return '';

    const trimmed = value.trim();
    if (!trimmed) return '';

    if (/^(blob:|data:)/i.test(trimmed)) {
        return trimmed;
    }

    // Absolute URL — if pointing to a local upload host, rewrite the path
    // so it goes through the /api proxy. Otherwise return as-is.
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            if (LOCAL_UPLOAD_HOSTS.has(parsed.hostname.toLowerCase()) && parsed.pathname.startsWith('/uploads/')) {
                return rewriteUploadsPath(parsed.pathname) + parsed.search + parsed.hash;
            }
        } catch {
            // fall through
        }
        return trimmed;
    }

    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    // /uploads/... → /api/uploads/... (proxied by Vite in dev, nginx in prod)
    if (normalizedPath.startsWith('/uploads/')) {
        return rewriteUploadsPath(normalizedPath);
    }

    // Already /api/uploads/... — return as-is (relative, proxied)
    if (normalizedPath.startsWith('/api/uploads/')) {
        return normalizedPath;
    }

    return trimmed;
}
