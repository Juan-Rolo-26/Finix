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
    fontFamily: '"Satoshi", system-ui, sans-serif',
    lineHeight: '1.6',
    minWidth: '160px',
};

export const CHART_AXIS_TICK = {
    fill: 'rgba(100, 116, 139, 0.92)',
    fontSize: 12,
};

export function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatCompactCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1, signed = false) {
    const sign = signed && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function truncateLabel(value: string, maxLength = 14) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function titleCase(value: string) {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}
