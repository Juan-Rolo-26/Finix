/**
 * usePortfolioCharts.ts — React hooks for portfolio analytics data.
 *
 * Each hook handles: loading, error, data, and refetch.
 * All hooks are memoized and safe for concurrent React 18.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimeRange } from '@/components/charts/utils/chartTheme';
import {
  getPortfolioSummary,
  getPortfolioPerformance,
  getPortfolioAllocation,
  getAssetPnL,
  getPortfolioReturns,
  getPortfolioDrawdown,
  getPortfolioDividends,
  getPortfolioRisk,
  getPortfolioBenchmarks,
} from '@/services/portfolioChartsService';
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

// ─── Generic hook factory ─────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const versionRef = useRef(0);

  const fetch = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const version = ++versionRef.current;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (version === versionRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (version === versionRef.current) {
          setError(err?.message ?? 'Error desconocido');
          setLoading(false);
        }
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Public hooks ─────────────────────────────────────────────────────────────

export function usePortfolioSummary(
  portfolioId: string,
  currency?: string,
): AsyncState<PortfolioSummary> {
  return useAsyncData(
    () => getPortfolioSummary(portfolioId, currency),
    [portfolioId, currency],
  );
}

export function usePortfolioPerformance(
  portfolioId: string,
  range: TimeRange,
  currency?: string,
): AsyncState<PortfolioPerformanceData> {
  return useAsyncData(
    () => getPortfolioPerformance(portfolioId, range, currency),
    [portfolioId, range, currency],
  );
}

export function usePortfolioAllocation(
  portfolioId: string,
  groupBy = 'asset',
  currency?: string,
): AsyncState<AllocationData> {
  return useAsyncData(
    () => getPortfolioAllocation(portfolioId, groupBy, currency),
    [portfolioId, groupBy, currency],
  );
}

export function useAssetPnL(
  portfolioId: string,
  currency?: string,
): AsyncState<AssetPnLItem[]> {
  return useAsyncData(
    () => getAssetPnL(portfolioId, currency),
    [portfolioId, currency],
  );
}

export function usePortfolioReturns(
  portfolioId: string,
  year?: number,
  currency?: string,
): AsyncState<MonthlyReturn[]> {
  return useAsyncData(
    () => getPortfolioReturns(portfolioId, year, currency),
    [portfolioId, year, currency],
  );
}

export function usePortfolioDrawdown(
  portfolioId: string,
  range?: string,
  currency?: string,
): AsyncState<DrawdownStats> {
  return useAsyncData(
    () => getPortfolioDrawdown(portfolioId, range, currency),
    [portfolioId, range, currency],
  );
}

export function usePortfolioDividends(
  portfolioId: string,
  range?: string,
  currency?: string,
): AsyncState<DividendData> {
  return useAsyncData(
    () => getPortfolioDividends(portfolioId, range, currency),
    [portfolioId, range, currency],
  );
}

export function usePortfolioRisk(
  portfolioId: string,
  currency?: string,
): AsyncState<{ assets: RiskReturnItem[]; portfolio: { volatility: number; returnPct: number } | null }> {
  return useAsyncData(
    () => getPortfolioRisk(portfolioId, currency),
    [portfolioId, currency],
  );
}

export function usePortfolioBenchmarks(
  portfolioId: string,
  range: TimeRange,
  benchmarks?: string[],
  currency?: string,
): AsyncState<BenchmarkData> {
  const benchmarksKey = (benchmarks ?? ['sp500']).join(',');
  return useAsyncData(
    () => getPortfolioBenchmarks(portfolioId, range, benchmarks, currency),
    [portfolioId, range, benchmarksKey, currency],
  );
}
