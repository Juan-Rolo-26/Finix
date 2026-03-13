const LOCAL_UPLOAD_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function getUploadsBaseUrl() {
    const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (!configuredApiUrl || configuredApiUrl === '/api') {
        return typeof window !== 'undefined' ? window.location.origin : '';
    }

    if (/^https?:\/\//i.test(configuredApiUrl)) {
        return configuredApiUrl.replace(/\/api\/?$/, '');
    }

    if (configuredApiUrl.startsWith('/')) {
        return typeof window !== 'undefined' ? window.location.origin : '';
    }

    return configuredApiUrl.replace(/\/api\/?$/, '');
}

export function resolveMediaUrl(value?: string | null) {
    if (typeof value !== 'string') return '';

    const trimmed = value.trim();
    if (!trimmed) return '';

    if (/^(blob:|data:)/i.test(trimmed)) {
        return trimmed;
    }

    const uploadsBaseUrl = getUploadsBaseUrl();

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            if (parsed.pathname.startsWith('/uploads/') && LOCAL_UPLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
                return `${uploadsBaseUrl.replace(/\/$/, '')}${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        } catch {
            return trimmed;
        }

        return trimmed;
    }

    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (!normalizedPath.startsWith('/uploads/')) {
        return trimmed;
    }

    return uploadsBaseUrl
        ? `${uploadsBaseUrl.replace(/\/$/, '')}${normalizedPath}`
        : normalizedPath;
}
