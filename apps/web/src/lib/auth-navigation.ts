export function normalizeRedirectTarget(value?: string | null): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/dashboard';
    try {
        const url = new URL(value, 'https://finix.invalid');
        return url.origin === 'https://finix.invalid' ? `${url.pathname}${url.search}${url.hash}` : '/dashboard';
    } catch { return '/dashboard'; }
}
