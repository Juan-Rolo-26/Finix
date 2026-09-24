import type React from 'react';

export const FINTECH_COLORS = {
    portfolio: '#10b981',
    portfolioFill: '#34d399',
    benchmark: '#94a3b8',
    positive: '#22c55e',
    negative: '#ef4444',
    accent: '#38bdf8',
    muted: '#64748b',
    allocation: ['#10b981', '#0ea5e9', '#38bdf8', '#f59e0b', '#6366f1', '#14b8a6'],
    treemap: ['#0f766e', '#0369a1', '#1d4ed8', '#4338ca', '#0f766e', '#b45309'],
} as const;

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: 'hsl(var(--popover) / 0.97)',
    border: '1px solid hsl(var(--border) / 0.8)',
    borderRadius: '14px',
    color: 'hsl(var(--popover-foreground))',
    boxShadow: '0 16px 40px hsl(var(--foreground) / 0.08), 0 2px 8px hsl(var(--foreground) / 0.04)',
    padding: '14px 18px',
    fontSize: '14px',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    lineHeight: '1.6',
    minWidth: '160px',
};

export const CHART_AXIS_TICK = {
    fill: 'rgba(100, 116, 139, 0.92)',
    fontSize: 12,
};

const DASHBOARD_CURRENCY_FORMATTERS = {
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol', maximumFractionDigits: 0 }),
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code', maximumFractionDigits: 0 }),
} as const;

const DASHBOARD_COMPACT_CURRENCY_FORMATTERS = {
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol', notation: 'compact', maximumFractionDigits: 1 }),
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code', notation: 'compact', maximumFractionDigits: 1 }),
} as const;

export function formatCurrency(value: number, currency = 'USD') {
    const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    const currencyCode = currency === 'USD MEP' ? 'USD' : currency.toUpperCase();
    const formatter = DASHBOARD_CURRENCY_FORMATTERS[currencyCode as keyof typeof DASHBOARD_CURRENCY_FORMATTERS] ?? DASHBOARD_CURRENCY_FORMATTERS.USD;
    return formatter.format(safe);
}

export function formatCompactCurrency(value: number, currency = 'USD') {
    const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    const currencyCode = currency === 'USD MEP' ? 'USD' : currency.toUpperCase();
    const formatter = DASHBOARD_COMPACT_CURRENCY_FORMATTERS[currencyCode as keyof typeof DASHBOARD_COMPACT_CURRENCY_FORMATTERS] ?? DASHBOARD_COMPACT_CURRENCY_FORMATTERS.USD;
    return formatter.format(safe);
}

export function formatPercent(value: number, fractionDigits = 1, signed = false) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return signed ? '+0.0%' : '0.0%';
    }
    const sign = signed && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function formatChartDate(value: string, range?: string) {
    if (!value || value === 'Inicio' || value === 'Hoy') return value;

    const date = value.includes('T')
        ? new Date(value)
        : new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    if (range === '1D') {
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    if (range === '1W') {
        return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' }).replace('.', '');
    }

    if (range === '1M' || range === '3M' || range === '6M') {
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '');
    }

    return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }).replace('.', '');
}

export function truncateLabel(value: string, maxLength = 14) {
    if (!value || typeof value !== 'string') return '';
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
}

export function clamp(value: number, min: number, max: number) {
    const safe = typeof value === 'number' && Number.isFinite(value) ? value : min;
    return Math.min(Math.max(safe, min), max);
}

export function titleCase(value: string) {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}
