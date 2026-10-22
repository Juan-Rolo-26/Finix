const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
/** Keep stored precision; round only the visible numeric metric. */
export function formatAnalysisMetric(value: unknown): string {
    if (value === null || value === undefined || value === '') return 'No informado';
    const numeric = typeof value === 'number' ? value : typeof value === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : null;
    if (numeric === null) return String(value);
    if (!Number.isFinite(numeric)) return 'No informado';
    return decimal.format(Math.abs(numeric) < 0.005 ? 0 : numeric);
}
