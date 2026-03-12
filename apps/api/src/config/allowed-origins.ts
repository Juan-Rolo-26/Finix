const LOCAL_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:4174',
];

const normalizeOrigin = (value?: string | null) => value?.trim().replace(/\/$/, '') || null;

const parseCsvOrigins = (value?: string | null) =>
    (value || '')
        .split(',')
        .map((item) => normalizeOrigin(item))
        .filter((item): item is string => Boolean(item));

const expandOriginVariants = (origin: string) => {
    try {
        const url = new URL(origin);
        const normalized = normalizeOrigin(origin);

        if (!normalized) {
            return [];
        }

        const variants = new Set([normalized]);
        const bareHost = url.hostname.replace(/^www\./, '');
        const base = `${url.protocol}//${bareHost}${url.port ? `:${url.port}` : ''}`;
        variants.add(base);
        variants.add(`${url.protocol}//www.${bareHost}${url.port ? `:${url.port}` : ''}`);

        return Array.from(variants);
    } catch {
        return [origin];
    }
};

export const getAllowedOrigins = () => {
    const origins = new Set<string>();
    const configuredOrigins = [
        ...parseCsvOrigins(process.env.ALLOWED_ORIGINS),
        normalizeOrigin(process.env.FRONTEND_URL),
        normalizeOrigin(process.env.ADMIN_URL),
    ].filter((origin): origin is string => Boolean(origin));

    for (const origin of configuredOrigins) {
        for (const variant of expandOriginVariants(origin)) {
            origins.add(variant);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        for (const origin of LOCAL_ORIGINS) {
            origins.add(origin);
        }
    }

    return Array.from(origins);
};

export const isAllowedOrigin = (origin?: string | null) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
        return true;
    }

    return getAllowedOrigins().includes(normalizedOrigin);
};
