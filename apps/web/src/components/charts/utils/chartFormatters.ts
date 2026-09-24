/**
 * chartFormatters.ts — Finix Chart Formatters
 *
 * Shared formatters for all chart components.
 * All monetary values follow Argentine locale (es-AR).
 * Professional display: US$ 12.481,32 · ARS 4,2M · +18,42% · -US$ 241,18
 */

import type { PortfolioCurrency, TimeRange } from './chartTheme';

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a monetary value for chart labels and tooltips.
 * @example formatCurrency(12481.32, 'USD') → 'US$ 12.481,32'
 * @example formatCurrency(-241.18, 'USD') → '-US$ 241,18'
 */
export function formatCurrency(
  value: number,
  currency: PortfolioCurrency | string = 'USD',
  options?: Intl.NumberFormatOptions,
): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const currencyCode = currency === 'USD MEP' ? 'USD' : currency;

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(safe);
  } catch {
    return `${currencyCode} ${safe.toFixed(2)}`;
  }
}

/**
 * Formats a compact monetary value (K, M, B notation).
 * @example formatCompactCurrency(4200000, 'ARS') → 'ARS 4,2M'
 * @example formatCompactCurrency(12500, 'USD') → 'US$ 12,5K'
 */
export function formatCompactCurrency(
  value: number,
  currency: PortfolioCurrency | string = 'USD',
): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  const currencyCode = currency === 'USD MEP' ? 'USD' : currency;
  const symbol = currencyCode === 'USD' ? 'US$' : currencyCode;

  if (abs >= 1_000_000_000) {
    return `${sign}${symbol} ${(abs / 1_000_000_000).toLocaleString('es-AR', { maximumFractionDigits: 2 })}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${symbol} ${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${symbol} ${(abs / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}K`;
  }
  return formatCurrency(safe, currency);
}

// ─── Percentage ───────────────────────────────────────────────────────────────

/**
 * Formats a percentage with optional sign prefix.
 * @example formatPercentage(18.42) → '+18,42%'
 * @example formatPercentage(-3.5, 1) → '-3,5%'
 */
export function formatPercentage(
  value: number,
  decimals = 2,
  showSign = true,
): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const sign = showSign && safe > 0 ? '+' : '';
  return `${sign}${safe.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

// ─── PnL ──────────────────────────────────────────────────────────────────────

/**
 * Formats profit/loss value with currency sign prefix.
 * @example formatPnL(1234.56, 'USD') → '+US$ 1.234,56'
 * @example formatPnL(-241.18, 'USD') → '-US$ 241,18'
 */
export function formatPnL(value: number, currency: PortfolioCurrency | string = 'USD'): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const sign = safe > 0 ? '+' : '';
  return `${sign}${formatCurrency(safe, currency)}`;
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Formats a compact number without currency.
 * @example formatCompactNumber(4200000) → '4,2M'
 */
export function formatCompactNumber(value: number): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString('es-AR', { maximumFractionDigits: 2 })}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}K`;
  return `${sign}${abs.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Formats a date string or Date for chart labels.
 * Adapts format based on the selected time range.
 */
export function formatChartDate(date: string | Date, range: TimeRange): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return String(date);

  if (range === '1D') {
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (range === '1S') {
    const day = d.toLocaleDateString('es-AR', { weekday: 'short' });
    return `${day.charAt(0).toUpperCase() + day.slice(1, 3)} ${d.getDate()}`;
  }
  if (range === '1M' || range === '3M') {
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
  }
  if (range === '6M' || range === 'YTD') {
    return d.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }).replace('.', '');
  }
  if (range === '1A') {
    const month = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
    return `${month.charAt(0).toUpperCase() + month.slice(1)} '${d.getFullYear().toString().slice(-2)}`;
  }
  // 3A, 5A, TODO
  return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }).replace('.', '');
}

/**
 * Formats a date for tooltip display (full date).
 * @example formatTooltipDate('2025-08-15') → 'Vie 15 ago 2025'
 */
export function formatTooltipDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Portfolio value ──────────────────────────────────────────────────────────

/**
 * Formats a portfolio total value with appropriate precision.
 */
export function formatPortfolioValue(value: number, currency: PortfolioCurrency | string = 'USD'): string {
  return formatCurrency(value, currency);
}

// ─── Sector / asset name ──────────────────────────────────────────────────────

/**
 * Truncates a label to maxLength, appending ellipsis if needed.
 */
export function truncateLabel(value: string, maxLength = 18): string {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

// ─── Safe value ───────────────────────────────────────────────────────────────

/** Returns 0 for any non-finite number. */
export function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
