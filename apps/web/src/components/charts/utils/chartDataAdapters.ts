/**
 * chartDataAdapters.ts — Finix Chart Data Adapters
 *
 * Transforms raw API responses into chart-ready data structures.
 * Keeps data transformation logic out of chart components.
 */

import type { TimeRange, BenchmarkKey } from './chartTheme';

// ─── TypeScript interfaces for API responses ──────────────────────────────────

export interface PortfolioSummary {
  totalValue: number;
  investedCapital: number;
  pnl: number;
  returnPct: number;
  ytdReturn: number;
  oneYearReturn: number;
  cagr: number | null;
  volatility: number | null;
  sharpe: number | null;
  maxDrawdown: number | null;
  dividendsTotal: number;
  cashBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface PerformancePoint {
  date: string;
  value: number;         // Portfolio value in currency
  returnPct: number;     // Cumulative return % from period start
  pnl: number;           // Cumulative PnL
  invested: number;      // Invested capital at this point
  dailyReturn?: number;  // Daily return %
}

export interface PerformanceMarker {
  date: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAW';
  ticker?: string;
  amount: number;
}

export interface PortfolioPerformanceData {
  range: TimeRange;
  currency: string;
  series: PerformancePoint[];
  markers: PerformanceMarker[];
  insufficientData?: boolean;
  message?: string;
}

export interface AllocationItem {
  name: string;
  ticker?: string;
  value: number;
  percent: number;
  currency: string;
}

export interface AllocationData {
  groupBy: string;
  total: number;
  items: AllocationItem[];
}

export interface AssetPnLItem {
  ticker: string;
  name?: string;
  returnPct: number;
  pnlUsd: number;
  pnlArs?: number;
  weight: number;
  currentValue: number;
  costBasis: number;
}

export interface MonthlyReturn {
  monthKey: string;     // "2025-01"
  label: string;        // "ENE"
  year: number;
  month: number;
  value: number;        // Return %
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;     // Negative %, e.g. -12.5
  peakValue?: number;
}

export interface DrawdownStats {
  maxDrawdown: number;
  maxDrawdownDate: string;
  recoveryDate: string | null;
  currentDrawdown: number;
  peakValue: number;
  peakDate: string;
  series: DrawdownPoint[];
}

export interface DividendItem {
  date: string;
  ticker: string;
  amount: number;
  currency: string;
}

export interface DividendData {
  byMonth: Array<{ label: string; monthKey: string; amount: number }>;
  byAsset: Array<{ ticker: string; total: number; count: number }>;
  accumulated: Array<{ date: string; cumulative: number }>;
  totalReceived: number;
  estimatedYield: number;
  confirmed: DividendItem[];
}

export interface RiskReturnItem {
  ticker: string;
  name?: string;
  returnPct: number;
  volatility: number;
  weight: number;
  sharpe: number | null;
}

export interface BenchmarkPoint {
  date: string;
  portfolio: number;    // Normalized, base 100
  [key: string]: number | string; // benchmark keys
}

export interface BenchmarkData {
  range: TimeRange;
  series: BenchmarkPoint[];
  benchmarks: BenchmarkKey[];
  returns: Record<string, number>; // "portfolio" | BenchmarkKey → final return %
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

/**
 * Converts raw API performance series to chart-ready data.
 * Normalizes series to Base 100 for percentage view.
 */
export function adaptPerformanceSeries(
  raw: PerformancePoint[],
  viewMode: 'value' | 'returnPct' | 'pnl' = 'value',
): Array<{ date: string; y: number; rawValue: number; invested: number }> {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw.map((pt) => ({
    date: pt.date,
    y: viewMode === 'value' ? pt.value
      : viewMode === 'returnPct' ? pt.returnPct
      : pt.pnl,
    rawValue: pt.value,
    invested: pt.invested,
  }));
}

/**
 * Converts allocation API response to chart data for donut/bar.
 */
export function adaptAllocationToChartData(data: AllocationData): Array<{
  name: string;
  value: number;
  percent: number;
  ticker?: string;
}> {
  if (!data?.items?.length) return [];

  return data.items
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Groups monthly returns by year for the heatmap.
 * Returns a map of year → array of 12 monthly returns (null if unavailable).
 */
export function groupReturnsByYear(
  returns: MonthlyReturn[],
): Map<number, Array<number | null>> {
  const result = new Map<number, Array<number | null>>();

  if (!Array.isArray(returns)) return result;

  for (const entry of returns) {
    if (!result.has(entry.year)) {
      result.set(entry.year, new Array(12).fill(null));
    }
    const arr = result.get(entry.year)!;
    arr[entry.month - 1] = entry.value;
  }

  return result;
}

/**
 * Normalizes multiple series to Base 100 from the first point.
 * Used for benchmark comparison charts.
 */
export function normalizeToBase100(
  series: Array<{ date: string; value: number }>,
): Array<{ date: string; normalized: number }> {
  if (!series?.length) return [];

  const baseValue = series[0].value;
  if (!baseValue || baseValue <= 0) return [];

  return series.map((pt) => ({
    date: pt.date,
    normalized: Number(((pt.value / baseValue) * 100).toFixed(2)),
  }));
}

/**
 * Transforms drawdown points for area chart (always negative).
 */
export function adaptDrawdownForChart(stats: DrawdownStats): Array<{
  date: string;
  drawdown: number;
  isMax: boolean;
}> {
  if (!stats?.series?.length) return [];

  const minDrawdown = Math.min(...stats.series.map((p) => p.drawdown));

  return stats.series.map((pt) => ({
    date: pt.date,
    drawdown: Number(pt.drawdown.toFixed(2)),
    isMax: Math.abs(pt.drawdown - minDrawdown) < 0.01,
  }));
}

/**
 * Transforms asset PnL data for horizontal bar chart.
 * Sorts by return percentage descending.
 */
export function sortAssetsByReturn(
  assets: AssetPnLItem[],
  metric: 'returnPct' | 'pnlUsd' | 'pnlArs' = 'returnPct',
): AssetPnLItem[] {
  return [...(assets ?? [])].sort((a, b) => {
    const aVal = metric === 'returnPct' ? a.returnPct : metric === 'pnlUsd' ? a.pnlUsd : (a.pnlArs ?? 0);
    const bVal = metric === 'returnPct' ? b.returnPct : metric === 'pnlUsd' ? b.pnlUsd : (b.pnlArs ?? 0);
    return bVal - aVal;
  });
}
