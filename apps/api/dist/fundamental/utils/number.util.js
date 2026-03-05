"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.safeRatio = safeRatio;
exports.cagrFromSeries = cagrFromSeries;
exports.clamp = clamp;
function toNumber(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (!normalized)
            return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function safeRatio(numerator, denominator) {
    if (numerator === null || denominator === null)
        return null;
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator))
        return null;
    if (denominator === 0)
        return null;
    return numerator / denominator;
}
function cagrFromSeries(values, years) {
    const clean = values.filter((value) => typeof value === 'number' && value > 0);
    if (clean.length < 2 || years <= 0)
        return null;
    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first <= 0 || last <= 0)
        return null;
    const cagr = Math.pow(last / first, 1 / years) - 1;
    return Number.isFinite(cagr) ? cagr * 100 : null;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
//# sourceMappingURL=number.util.js.map