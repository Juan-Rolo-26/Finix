/**
 * portfolioChartsService.ts — Finix Portfolio Charts Data Service
 *
 * All HTTP calls to the new portfolio analytics endpoints.
 * Centralizes API URL, auth token, and error handling.
 */

import type { TimeRange } from '@/components/charts/utils/chartTheme';
import type {
  PortfolioSummary,
  PortfolioPerformanceData,
  AllocationData,
  MonthlyReturn,
  DrawdownStats,
  DividendData,
  RiskReturnItem,
  BenchmarkData,
  AssetPnLItem,
} from '@/components/charts/utils/chartDataAdapters';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });
  }
  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? `API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ─── Portfolio Analytics Endpoints ───────────────────────────────────────────

/**
 * Summary metrics: totalValue, pnl, return%, volatility, sharpe, CAGR
 */
export async function getPortfolioSummary(
  portfolioId: string,
  currency?: string,
): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>(`/portfolios/${portfolioId}/summary`, {
    ...(currency ? { currency } : {}),
  });
}

/**
 * Historical performance series for the main chart.
 * Returns TWR-based series + markers for operations.
 */
export async function getPortfolioPerformance(
  portfolioId: string,
  range: TimeRange,
  currency?: string,
): Promise<PortfolioPerformanceData> {
  return apiFetch<PortfolioPerformanceData>(`/portfolios/${portfolioId}/performance`, {
    range,
    ...(currency ? { currency } : {}),
  });
}

/**
 * Portfolio allocation data grouped by asset/sector/industry/country/type/currency.
 */
export async function getPortfolioAllocation(
  portfolioId: string,
  groupBy = 'asset',
  currency?: string,
): Promise<AllocationData> {
  return apiFetch<AllocationData>(`/portfolios/${portfolioId}/allocation`, {
    groupBy,
    ...(currency ? { currency } : {}),
  });
}

/**
 * Per-asset P&L: return %, PnL USD, ARS, weight, cost.
 */
export async function getAssetPnL(
  portfolioId: string,
  currency?: string,
): Promise<AssetPnLItem[]> {
  return apiFetch<AssetPnLItem[]>(`/portfolios/${portfolioId}/asset-pnl`, {
    ...(currency ? { currency } : {}),
  });
}

/**
 * Monthly return series, grouped by year.
 */
export async function getPortfolioReturns(
  portfolioId: string,
  year?: number,
): Promise<MonthlyReturn[]> {
  return apiFetch<MonthlyReturn[]>(`/portfolios/${portfolioId}/returns`, {
    ...(year ? { year: String(year) } : {}),
  });
}

/**
 * Drawdown analysis: max DD, current DD, peak, series.
 */
export async function getPortfolioDrawdown(
  portfolioId: string,
  range?: string,
): Promise<DrawdownStats> {
  return apiFetch<DrawdownStats>(`/portfolios/${portfolioId}/drawdown`, {
    ...(range ? { range } : {}),
  });
}

/**
 * Dividend income history: monthly, by-asset, accumulated, yield.
 */
export async function getPortfolioDividends(
  portfolioId: string,
  range?: string,
  currency?: string,
): Promise<DividendData> {
  return apiFetch<DividendData>(`/portfolios/${portfolioId}/dividends`, {
    ...(range ? { range } : {}),
    ...(currency ? { currency } : {}),
  });
}

/**
 * Per-asset risk metrics: volatility, return, weight, Sharpe.
 */
export async function getPortfolioRisk(
  portfolioId: string,
  currency?: string,
): Promise<{ assets: RiskReturnItem[]; portfolio: { volatility: number; returnPct: number } | null }> {
  return apiFetch(`/portfolios/${portfolioId}/risk`, {
    ...(currency ? { currency } : {}),
  });
}

/**
 * Normalized benchmark comparison (Base 100) vs SPY, QQQ, MEP, etc.
 */
export async function getPortfolioBenchmarks(
  portfolioId: string,
  range: TimeRange,
  benchmarks = ['sp500'],
): Promise<BenchmarkData> {
  return apiFetch<BenchmarkData>(`/portfolios/${portfolioId}/benchmarks`, {
    range,
    benchmarks: benchmarks.join(','),
  });
}
