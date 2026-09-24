/**
 * chartTheme.ts — Finix Chart Design System
 *
 * Centralizes all chart colors, typography, and style tokens.
 * Reads from CSS variables defined in index.css to ensure
 * dark/light mode compatibility across all chart libraries.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const CHART_COLORS = {
  // Primary series colors — ordered by visual priority
  series: [
    '#10b981', // emerald-500  (primary)
    '#38bdf8', // sky-400       (secondary)
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f87171', // red-400
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#fb923c', // orange-400
    '#a3e635', // lime-400
  ],

  // Semantic
  positive: '#10b981',   // gains, up
  negative: '#f43f5e',   // losses, down
  neutral: '#94a3b8',    // neutral / unchanged

  // Gradient stops
  positiveGradientStart: 'rgba(16,185,129,0.28)',
  positiveGradientEnd: 'rgba(16,185,129,0.02)',
  negativeGradientStart: 'rgba(244,63,94,0.28)',
  negativeGradientEnd: 'rgba(244,63,94,0.02)',

  // Grid and axes
  gridLine: 'rgba(148,163,184,0.08)',
  axisLine: 'rgba(148,163,184,0.12)',
  axisTick: 'rgba(148,163,184,0.85)',

  // Background surfaces
  tooltip: 'rgba(15,20,40,0.97)',
  tooltipBorder: 'rgba(255,255,255,0.1)',

  // Benchmark colors
  portfolio: '#10b981',
  sp500: '#38bdf8',
  nasdaq: '#8b5cf6',
  mep: '#f59e0b',
  benchmark2: '#ec4899',
} as const;

// ─── Benchmark registry ───────────────────────────────────────────────────────

export type BenchmarkKey = 'sp500' | 'nasdaq' | 'mep';

export const BENCHMARK_CONFIG: Record<BenchmarkKey, { label: string; color: string; symbol: string }> = {
  sp500: { label: 'S&P 500', color: CHART_COLORS.sp500, symbol: 'SPY' },
  nasdaq: { label: 'Nasdaq 100', color: CHART_COLORS.nasdaq, symbol: 'QQQ' },
  mep: { label: 'Dólar MEP', color: CHART_COLORS.mep, symbol: 'MEP' },
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const CHART_FONT = {
  family: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
  sizeSm: 11,
  sizeMd: 12,
  sizeLg: 13,
  weightNormal: 400,
  weightMedium: 500,
  weightBold: 600,
  weightBlack: 700,
} as const;

// ─── Axis tick style (Recharts compatible) ────────────────────────────────────

export const CHART_AXIS_TICK = {
  fill: CHART_COLORS.axisTick,
  fontSize: CHART_FONT.sizeMd,
  fontFamily: CHART_FONT.family,
  fontWeight: CHART_FONT.weightMedium,
} as const;

// ─── Tooltip style (Recharts contentStyle compatible) ────────────────────────

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: CHART_COLORS.tooltip,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: '14px',
  color: 'rgba(248,250,252,0.95)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
  padding: '12px 16px',
  fontSize: `${CHART_FONT.sizeMd}px`,
  fontFamily: CHART_FONT.family,
  lineHeight: '1.55',
  minWidth: '180px',
  backdropFilter: 'blur(16px)',
};

// Keep React import for the type — resolved via ambient TS in consumers
import type React from 'react';

// ─── LightweightCharts theme ──────────────────────────────────────────────────

export const LIGHTWEIGHT_CHART_THEME = {
  layout: {
    background: { color: 'transparent' },
    textColor: CHART_COLORS.axisTick,
    fontSize: CHART_FONT.sizeSm,
    fontFamily: CHART_FONT.family,
  },
  grid: {
    vertLines: { color: CHART_COLORS.gridLine, visible: false },
    horzLines: { color: CHART_COLORS.gridLine, visible: true },
  },
  crosshair: {
    mode: 1, // Magnet
    vertLine: {
      color: 'rgba(148,163,184,0.5)',
      width: 1 as const,
      style: 3 as const,
      labelBackgroundColor: '#1e293b',
    },
    horzLine: {
      color: 'rgba(148,163,184,0.5)',
      width: 1 as const,
      style: 3 as const,
      labelBackgroundColor: '#1e293b',
    },
  },
  rightPriceScale: {
    borderColor: CHART_COLORS.axisLine,
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: CHART_COLORS.axisLine,
    fixLeftEdge: true,
    fixRightEdge: true,
    lockVisibleTimeRangeOnResize: true,
  },
} as const;

// ─── ECharts base theme ───────────────────────────────────────────────────────

export const ECHARTS_BASE_THEME = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: CHART_FONT.family,
    color: CHART_COLORS.axisTick,
  },
  color: CHART_COLORS.series,
  grid: {
    top: 20,
    right: 16,
    bottom: 36,
    left: 16,
    containLabel: true,
  },
  tooltip: {
    backgroundColor: CHART_COLORS.tooltip,
    borderColor: CHART_COLORS.tooltipBorder,
    borderRadius: 12,
    textStyle: {
      color: 'rgba(248,250,252,0.95)',
      fontFamily: CHART_FONT.family,
      fontSize: CHART_FONT.sizeMd,
    },
    extraCssText: 'backdrop-filter: blur(16px); box-shadow: 0 24px 48px rgba(0,0,0,0.45);',
  },
  legend: {
    textStyle: {
      color: CHART_COLORS.axisTick,
      fontFamily: CHART_FONT.family,
      fontSize: CHART_FONT.sizeMd,
    },
    inactiveColor: 'rgba(148,163,184,0.3)',
  },
} as const;

// ─── Time range config ────────────────────────────────────────────────────────

export const TIME_RANGES = ['1D', '1S', '1M', '3M', '6M', 'YTD', '1A', '3A', '5A', 'TODO'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1D': '1 Día',
  '1S': '1 Semana',
  '1M': '1 Mes',
  '3M': '3 Meses',
  '6M': '6 Meses',
  'YTD': 'Año en curso',
  '1A': '1 Año',
  '3A': '3 Años',
  '5A': '5 Años',
  'TODO': 'Todo',
};

export const TIME_RANGE_TO_API: Record<TimeRange, string> = {
  '1D': '1D',
  '1S': '1W',
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
  'YTD': 'YTD',
  '1A': '1Y',
  '3A': '3Y',
  '5A': '5Y',
  'TODO': 'ALL',
};

// ─── Currency config ──────────────────────────────────────────────────────────

export const CURRENCIES = ['USD', 'ARS', 'USD MEP'] as const;
export type PortfolioCurrency = (typeof CURRENCIES)[number];

// ─── Treemap color scale (rendimiento) ───────────────────────────────────────

export function getReturnColor(returnPct: number): string {
  if (returnPct > 15) return '#059669';
  if (returnPct > 8) return '#10b981';
  if (returnPct > 3) return '#34d399';
  if (returnPct > 0) return '#6ee7b7';
  if (returnPct === 0) return '#64748b';
  if (returnPct > -3) return '#fca5a5';
  if (returnPct > -8) return '#f87171';
  if (returnPct > -15) return '#ef4444';
  return '#dc2626';
}
