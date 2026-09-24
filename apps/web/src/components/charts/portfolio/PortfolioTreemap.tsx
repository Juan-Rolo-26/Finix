/**
 * PortfolioTreemap.tsx — Portfolio allocation treemap using Apache ECharts.
 *
 * Features:
 *  - Tile size = portfolio weight
 *  - Color = return % (green positive / red negative)
 *  - Drill-down into sectors
 *  - Rich tooltip
 *  - ResizeObserver for responsive
 *  - Full cleanup on unmount
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { getReturnColor, CHART_FONT, ECHARTS_BASE_THEME } from '../utils/chartTheme';
import { formatPercentage, formatCurrency, formatCompactCurrency, truncateLabel } from '../utils/chartFormatters';
import type { AssetPnLItem } from '../utils/chartDataAdapters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioTreemapProps {
  data?: AssetPnLItem[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: string;
  className?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortfolioTreemap({
  data,
  loading,
  error,
  onRetry,
  currency = 'USD',
  className,
}: PortfolioTreemapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsInstanceRef = useRef<echarts.ECharts | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    return data
      .filter((item) => item.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue)
      .map((item) => ({
        name: item.ticker,
        fullName: item.name ?? item.ticker,
        value: item.currentValue,
        weight: item.weight,
        returnPct: item.returnPct,
        pnlUsd: item.pnlUsd,
        costBasis: item.costBasis,
        // ECharts specific
        itemStyle: {
          color: getReturnColor(item.returnPct),
          borderColor: 'rgba(15,20,40,0.9)',
          borderWidth: 2,
          borderRadius: 6,
          gapWidth: 3,
        },
        label: {
          formatter: (params: any) => {
            const d = params.data;
            const nameStr = truncateLabel(d.name, 8);
            const retStr = formatPercentage(d.returnPct, 1);
            return `{name|${nameStr}}\n{ret|${retStr}}`;
          },
          rich: {
            name: {
              fontSize: 12,
              fontFamily: CHART_FONT.family,
              fontWeight: CHART_FONT.weightBold,
              color: '#fff',
              lineHeight: 18,
            },
            ret: {
              fontSize: 11,
              fontFamily: CHART_FONT.family,
              fontWeight: CHART_FONT.weightMedium,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 16,
            },
          },
        },
      }));
  }, [data]);

  const isEmpty = !loading && !error && chartData.length === 0;

  const initChart = useCallback(async () => {
    if (!chartRef.current) return;

    const echarts = await import('echarts/core');
    const { TreemapChart } = await import('echarts/charts');
    const { TooltipComponent, TitleComponent } = await import('echarts/components');
    const { CanvasRenderer } = await import('echarts/renderers');

    echarts.use([TreemapChart, TooltipComponent, TitleComponent, CanvasRenderer]);

    // Cleanup previous instance
    if (echartsInstanceRef.current) {
      echartsInstanceRef.current.dispose();
    }

    const instance = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    echartsInstanceRef.current = instance;

    const option = {
      ...ECHARTS_BASE_THEME,
      tooltip: {
        ...ECHARTS_BASE_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          if (!d) return '';
          const isPos = d.returnPct >= 0;
          const retColor = isPos ? '#34d399' : '#f87171';
          return `
            <div style="min-width:180px; font-family:${CHART_FONT.family}">
              <div style="font-size:13px; font-weight:800; color:#f8fafc; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                ${d.name} ${d.fullName !== d.name ? `<span style="opacity:0.6; font-weight:500; font-size:11px">— ${truncateLabel(d.fullName, 22)}</span>` : ''}
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; gap:16px;">
                  <span style="color:rgba(148,163,184,0.85)">Valor actual</span>
                  <span style="font-weight:700; color:#f8fafc; font-variant-numeric:tabular-nums">${formatCurrency(d.value, currency)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                  <span style="color:rgba(148,163,184,0.85)">Costo</span>
                  <span style="font-weight:600; color:rgba(248,250,252,0.75); font-variant-numeric:tabular-nums">${formatCurrency(d.costBasis, currency)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                  <span style="color:rgba(148,163,184,0.85)">G/P</span>
                  <span style="font-weight:700; color:${retColor}; font-variant-numeric:tabular-nums">${formatCurrency(d.pnlUsd, currency)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                  <span style="color:rgba(148,163,184,0.85)">Rendimiento</span>
                  <span style="font-weight:800; color:${retColor}; font-variant-numeric:tabular-nums">${formatPercentage(d.returnPct)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                  <span style="color:rgba(148,163,184,0.85)">Peso</span>
                  <span style="font-weight:600; color:rgba(248,250,252,0.75); font-variant-numeric:tabular-nums">${formatPercentage(d.weight, 1, false)}</span>
                </div>
              </div>
            </div>
          `;
        },
      },
      series: [
        {
          type: 'treemap',
          data: chartData,
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          levels: [
            {
              itemStyle: {
                borderColor: 'rgba(15,20,40,0.8)',
                borderWidth: 3,
                gapWidth: 3,
              },
            },
          ],
          label: {
            show: true,
            position: 'insideTopLeft',
            distance: 8,
          },
          upperLabel: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              borderColor: 'rgba(255,255,255,0.3)',
              borderWidth: 3,
            },
          },
          animationDuration: 600,
          animationEasing: 'cubicOut',
        },
      ],
    };

    instance.setOption(option);

    // ResizeObserver
    const observer = new ResizeObserver(() => {
      echartsInstanceRef.current?.resize();
    });
    observer.observe(chartRef.current!);
    resizeObserverRef.current = observer;
  }, [chartData, currency]);

  useEffect(() => {
    if (!isEmpty && !loading) {
      initChart();
    }
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      echartsInstanceRef.current?.dispose();
      echartsInstanceRef.current = null;
    };
  }, [initChart, isEmpty, loading]);

  // ── Color scale legend ───────────────────────────────────────────────────────
  const colorLegend = [
    { color: '#059669', label: '>15%' },
    { color: '#10b981', label: '>8%' },
    { color: '#34d399', label: '>0%' },
    { color: '#64748b', label: '0%' },
    { color: '#f87171', label: '<0%' },
    { color: '#ef4444', label: '<-8%' },
    { color: '#dc2626', label: '<-15%' },
  ];

  return (
    <ChartContainer
      title="Mapa de Posiciones"
      description="Tamaño = peso en portafolio · Color = rendimiento acumulado"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Agregá activos al portafolio para ver el mapa de posiciones."
      onRetry={onRetry}
      ariaLabel="Mapa de posiciones del portafolio"
      className={className}
      footer={
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-muted-foreground font-medium mr-1">Rendimiento:</span>
          {colorLegend.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{item.label}</span>
            </span>
          ))}
        </div>
      }
    >
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: '380px' }}
        role="img"
        aria-label="Treemap del portafolio"
      />
    </ChartContainer>
  );
}
