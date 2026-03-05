export function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

export function safeRatio(numerator: number | null, denominator: number | null): number | null {
    if (numerator === null || denominator === null) return null;
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
    if (denominator === 0) return null;
    return numerator / denominator;
}

export function cagrFromSeries(values: Array<number | null>, years: number): number | null {
    const clean = values.filter((value): value is number => typeof value === 'number' && value > 0);
    if (clean.length < 2 || years <= 0) return null;

    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first <= 0 || last <= 0) return null;

    const cagr = Math.pow(last / first, 1 / years) - 1;
    return Number.isFinite(cagr) ? cagr * 100 : null;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
