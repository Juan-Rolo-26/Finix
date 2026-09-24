/**
 * PortfolioPerformanceChart.tsx
 *
 * Main portfolio evolution chart using TradingView Lightweight Charts v5.
 * Features:
 *  - Real-time portfolio value, % return, or P&L
 *  - Time range selector: 1D, 1S, 1M, 3M, 6M, YTD, 1A, 3A, 5A, TODO
 *  - View mode: Valor | Rendimiento % | Ganancia/Pérdida
 *  - Professional crosshair with full tooltip
 *  - Operation markers (buy, sell, dividend, deposit, withdraw)
 *  - ResizeObserver for responsive
 *  - Full cleanup on unmount (no memory leaks)
 *  - Client-side only rendering
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { ChartSkeleton } from '../shared/ChartSkeleton';
import { LIGHTWEIGHT_CHART_THEME, CHART_COLORS, TIME_RANGES, type TimeRange } from '../utils/chartTheme';
import {
  formatCurrency,
  formatPercentage,
  formatPnL,
  formatTooltipDate,
  safeNum,
} from '../utils/chartFormatters';
import type { PortfolioPerformanceData, PerformanceMarker } from '../utils/chartDataAdapters';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'value' | 'returnPct' | 'pnl';

interface PortfolioPerformanceChartProps {
  data?: PortfolioPerformanceData | null;
  loading?: boolean;
  error?: string | null;
  onRangeChange?: (range: TimeRange) => void;
  onRetry?: () => void;
  currency?: string;
  className?: string;
}

interface CrosshairData {
  date: string;
  value: number;
  returnPct: number;
  pnl: number;
  invested: number;
  dailyReturn?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMarkerShape(type: PerformanceMarker['type']): 'arrowUp' | 'arrowDown' | 'circle' {
  if (type === 'BUY' || type === 'DEPOSIT') return 'arrowUp';
  if (type === 'SELL' || type === 'WITHDRAW') return 'arrowDown';
  return 'circle';
}

function getMarkerColor(type: PerformanceMarker['type']): string {
  if (type === 'BUY') return CHART_COLORS.positive;
  if (type === 'SELL') return CHART_COLORS.negative;
  if (type === 'DIVIDEND') return CHART_COLORS.series[1];
  if (type === 'DEPOSIT') return CHART_COLORS.series[2];
  if (type === 'WITHDRAW') return CHART_COLORS.series[5];
  return CHART_COLORS.neutral;
}

function getMarkerText(type: PerformanceMarker['type']): string {
  const map: Record<string, string> = {
    BUY: 'C', SELL: 'V', DIVIDEND: 'D', DEPOSIT: '+', WITHDRAW: '-',
  };
  return map[type] ?? '·';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortfolioPerformanceChart({
  data,
  loading = false,
  error = null,
  onRangeChange,
  onRetry,
  currency = 'USD',
  className,
}: PortfolioPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);
  const seriesRef = useRef<ReturnType<typeof import('lightweight-charts').IChartApi.prototype.addAreaSeries> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('value');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1A');
  const [crosshairData, setCrosshairData] = useState<CrosshairData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ── Compute chart data ──────────────────────────────────────────────────────
  const series = data?.series ?? [];
  const isEmpty = !loading && !error && series.length === 0;

  const firstPoint = series[0];
  const lastPoint = series[series.length - 1];

  const summary = useMemo(() => {
    if (!firstPoint || !lastPoint) return null;
    const currentValue = lastPoint.value;
    const absoluteChange = lastPoint.value - firstPoint.value;
    const pctChange = safeNum(lastPoint.returnPct);
    const pnl = lastPoint.pnl;
    const isPositive = pctChange >= 0;
    return { currentValue, absoluteChange, pctChange, pnl, isPositive };
  }, [firstPoint, lastPoint]);

  // ── Prepare series data ─────────────────────────────────────────────────────
  const lwcData = useMemo(() => {
    return series.map((pt) => ({
      time: pt.date as string,
      value: viewMode === 'value' ? pt.value
        : viewMode === 'returnPct' ? pt.returnPct
        : pt.pnl,
    }));
  }, [series, viewMode]);

  // ── Compute markers ─────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    return (data?.markers ?? [])
      .filter((m) => m.date >= (firstPoint?.date ?? ''))
      .map((m) => ({
        time: m.date as string,
        position: (m.type === 'BUY' || m.type === 'DEPOSIT') ? 'belowBar' as const : 'aboveBar' as const,
        color: getMarkerColor(m.type),
        shape: getMarkerShape(m.type),
        text: getMarkerText(m.type),
        size: 1,
      }));
  }, [data?.markers, firstPoint?.date]);

  // ── Mount LightweightCharts ─────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !chartContainerRef.current) return;

    let chart: ReturnType<typeof import('lightweight-charts').createChart>;

    (async () => {
      const { createChart, CrosshairMode, LineStyle } = await import('lightweight-charts');

      if (!chartContainerRef.current) return;

      // Cleanup previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const isPositive = summary?.isPositive ?? true;
      const strokeColor = isPositive ? CHART_COLORS.positive : CHART_COLORS.negative;

      chart = createChart(chartContainerRef.current, {
        ...LIGHTWEIGHT_CHART_THEME,
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        crosshair: {
          ...LIGHTWEIGHT_CHART_THEME.crosshair,
          mode: CrosshairMode.Magnet,
          vertLine: {
            ...LIGHTWEIGHT_CHART_THEME.crosshair.vertLine,
            style: LineStyle.Dashed,
          },
          horzLine: {
            ...LIGHTWEIGHT_CHART_THEME.crosshair.horzLine,
            style: LineStyle.Dashed,
          },
        },
      });

      chartRef.current = chart;

      const areaSeries = chart.addAreaSeries({
        lineColor: strokeColor,
        topColor: `${strokeColor}44`,
        bottomColor: `${strokeColor}05`,
        lineWidth: 2.5,
        priceFormat: {
          type: viewMode === 'returnPct' ? 'percent' : 'price',
          precision: viewMode === 'returnPct' ? 2 : 2,
          minMove: 0.01,
        },
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: strokeColor,
        crosshairMarkerBackgroundColor: 'hsl(222 28% 7%)',
      });

      seriesRef.current = areaSeries;

      if (lwcData.length > 0) {
        areaSeries.setData(lwcData);
      }
      if (markers.length > 0) {
        areaSeries.setMarkers(markers);
      }

      // Crosshair subscription
      chart.subscribeCrosshairMove((param) => {
        if (!param.point || !param.time || !param.seriesData.get(areaSeries)) {
          setCrosshairData(null);
          return;
        }
        const seriesValue = param.seriesData.get(areaSeries) as { value: number } | undefined;
        if (!seriesValue) return;

        const dateStr = String(param.time);
        const matchingPoint = series.find((pt) => pt.date === dateStr);

        setCrosshairData({
          date: dateStr,
          value: matchingPoint?.value ?? 0,
          returnPct: matchingPoint?.returnPct ?? 0,
          pnl: matchingPoint?.pnl ?? 0,
          invested: matchingPoint?.invested ?? 0,
          dailyReturn: matchingPoint?.dailyReturn,
        });
      });

      chart.timeScale().fitContent();

      // ResizeObserver
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (chartRef.current) {
            chartRef.current.applyOptions({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          }
        }
      });
      observer.observe(chartContainerRef.current);
      resizeObserverRef.current = observer;
    })();

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, viewMode, selectedRange]);

  // Update data without recreating chart
  useEffect(() => {
    if (!seriesRef.current || lwcData.length === 0) return;
    try {
      seriesRef.current.setData(lwcData);
      if (markers.length > 0) {
        seriesRef.current.setMarkers(markers);
      }
      chartRef.current?.timeScale().fitContent();
    } catch {
      // chart may have been removed
    }
  }, [lwcData, markers]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  }, [onRangeChange]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const isPositive = summary?.isPositive ?? true;
  const valueColor = isPositive ? 'text-emerald-500' : 'text-red-500';

  return (
    <ChartContainer
      title="Evolución del Portafolio"
      description="Valor patrimonial histórico con operaciones registradas"
      loading={false}
      error={error}
      empty={isEmpty}
      emptyMessage="Registrá tu primera operación para ver la evolución del portafolio."
      onRetry={onRetry}
      chartHeight={460}
      allowFullscreen
      ariaLabel="Gráfico de evolución del portafolio"
      className={className}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* View mode selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1" role="group" aria-label="Modo de visualización">
            {([
              { key: 'value', label: 'Valor' },
              { key: 'returnPct', label: 'Rend. %' },
              { key: 'pnl', label: 'G/P' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setViewMode(opt.key)}
                aria-pressed={viewMode === opt.key}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                  viewMode === opt.key
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="p-4">
          <ChartSkeleton height={380} />
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {/* ── Metrics strip ── */}
          <div className="px-5 py-4 sm:px-6 border-b border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current Value */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Valor total</span>
              <span className="mt-1 text-lg font-black tabular-nums tracking-tight text-foreground">
                {crosshairData
                  ? formatCurrency(crosshairData.value, currency)
                  : formatCurrency(summary?.currentValue ?? 0, currency)}
              </span>
            </div>
            {/* P&L */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Ganancia/Pérdida</span>
              <span className={cn('mt-1 text-lg font-black tabular-nums tracking-tight', valueColor)}>
                {crosshairData
                  ? formatPnL(crosshairData.pnl, currency)
                  : formatPnL(summary?.pnl ?? 0, currency)}
              </span>
            </div>
            {/* Return % */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rendimiento</span>
              <span className={cn('mt-1 text-lg font-black tabular-nums tracking-tight', valueColor)}>
                {crosshairData
                  ? formatPercentage(crosshairData.returnPct)
                  : formatPercentage(summary?.pctChange ?? 0)}
              </span>
            </div>
            {/* Invested */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Capital invertido</span>
              <span className="mt-1 text-lg font-black tabular-nums tracking-tight text-foreground/80">
                {crosshairData
                  ? formatCurrency(crosshairData.invested, currency)
                  : formatCurrency(firstPoint?.invested ?? 0, currency)}
              </span>
            </div>
          </div>

          {/* ── Range selector ── */}
          <div className="px-5 py-3 sm:px-6 flex flex-wrap items-center gap-1 border-b border-border/20" role="group" aria-label="Rango de tiempo">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                aria-pressed={selectedRange === range}
                className={cn(
                  'min-w-[36px] rounded-xl px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all cursor-pointer',
                  selectedRange === range
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* ── Crosshair Tooltip ── */}
          {crosshairData && (
            <div className="px-5 py-2 sm:px-6 border-b border-border/20 bg-muted/10 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              <span className="text-muted-foreground font-medium">{formatTooltipDate(crosshairData.date)}</span>
              {crosshairData.dailyReturn !== undefined && (
                <span className={cn('font-bold', crosshairData.dailyReturn >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  Variación diaria: {formatPercentage(crosshairData.dailyReturn)}
                </span>
              )}
              <span className={cn('font-bold', crosshairData.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                P&L acumulado: {formatPnL(crosshairData.pnl, currency)}
              </span>
            </div>
          )}

          {/* ── Chart canvas ── */}
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{ height: '380px' }}
            aria-hidden="true"
          />

          {/* ── Marker Legend ── */}
          <div className="px-5 py-2.5 sm:px-6 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t border-border/20">
            {[
              { color: CHART_COLORS.positive, label: 'Compra' },
              { color: CHART_COLORS.negative, label: 'Venta' },
              { color: CHART_COLORS.series[1], label: 'Dividendo' },
              { color: CHART_COLORS.series[2], label: 'Depósito' },
              { color: CHART_COLORS.series[5], label: 'Retiro' },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </ChartContainer>
  );
}
