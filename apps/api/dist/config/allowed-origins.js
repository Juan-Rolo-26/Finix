"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedOrigin = exports.getAllowedOrigins = void 0;
const LOCAL_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:4174',
];
const normalizeOrigin = (value) => value?.trim().replace(/\/$/, '') || null;
const parseCsvOrigins = (value) => (value || '')
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter((item) => Boolean(item));
const expandOriginVariants = (origin) => {
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
    }
    catch {
        return [origin];
    }
};
const getAllowedOrigins = () => {
    const origins = new Set();
    const configuredOrigins = [
        ...parseCsvOrigins(process.env.ALLOWED_ORIGINS),
        normalizeOrigin(process.env.FRONTEND_URL),
        normalizeOrigin(process.env.ADMIN_URL),
    ].filter((origin) => Boolean(origin));
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
exports.getAllowedOrigins = getAllowedOrigins;
const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
        return true;
    }
    return (0, exports.getAllowedOrigins)().includes(normalizedOrigin);
};
exports.isAllowedOrigin = isAllowedOrigin;
//# sourceMappingURL=allowed-origins.js.map