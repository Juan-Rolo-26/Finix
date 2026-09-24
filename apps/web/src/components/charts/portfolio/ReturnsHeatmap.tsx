/**
 * ReturnsHeatmap.tsx — Calendar heatmap of monthly returns using Apache ECharts.
 *
 * Shows all available years in a grid of months, colored by return %.
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_FONT, ECHARTS_BASE_THEME } from '../utils/chartTheme';
import { formatPercentage } from '../utils/chartFormatters';
import { groupReturnsByYear, type MonthlyReturn } from '../utils/chartDataAdapters';

interface ReturnsHeatmapProps {
  data?: MonthlyReturn[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** Converts return % to heatmap color (green+/red-) */
function returnToColor(value: number | null): string {
  if (value === null) return 'rgba(100,116,139,0.15)';
  if (value > 10) return '#059669';
  if (value > 5) return '#10b981';
  if (value > 2) return '#34d399';
  if (value > 0) return '#6ee7b7';
  if (value === 0) return '#475569';
  if (value > -2) return '#fca5a5';
  if (value > -5) return '#f87171';
  if (value > -10) return '#ef4444';
  return '#dc2626';
}

export function ReturnsHeatmap({ data, loading, error, onRetry, className }: ReturnsHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const byYear = useMemo(() => groupReturnsByYear(data ?? []), [data]);
  const years = useMemo(() => Array.from(byYear.keys()).sort(), [byYear]);

  const isEmpty = !loading && !error && years.length === 0;

  // Build flat array of [year, monthIdx, value] for heatmap
  const heatmapData = useMemo(() => {
    const rows: Array<[number, number, number | null]> = [];
    years.forEach((year) => {
      const months = byYear.get(year) ?? new Array(12).fill(null);
      months.forEach((val, mIdx) => {
        rows.push([year, mIdx, val]);
      });
    });
    return rows;
  }, [byYear, years]);

  const chartHeight = Math.max(160, years.length * 52 + 60);

  const initChart = useCallback(async () => {
    if (!chartRef.current || isEmpty) return;

    const echarts = await import('echarts/core');
    const { CustomChart } = await import('echarts/charts');
    const { TooltipComponent, GridComponent } = await import('echarts/components');
    const { CanvasRenderer } = await import('echarts/renderers');

    echarts.use([CustomChart, TooltipComponent, GridComponent, CanvasRenderer]);

    if (instanceRef.current) instanceRef.current.dispose();

    const instance = echarts.init(chartRef.current!, null, { renderer: 'canvas' });
    instanceRef.current = instance;

    const xData = MONTH_LABELS;
    const yData = years.map(String);

    const option = {
      ...ECHARTS_BASE_THEME,
      backgroundColor: 'transparent',
      tooltip: {
        ...ECHARTS_BASE_THEME.tooltip,
        formatter: (params: any) => {
          const [year, monthIdx, value] = params.data ?? [];
          const monthLabel = MONTH_LABELS[monthIdx] ?? '?';
          const valueStr = value !== null ? formatPercentage(value) : 'Sin datos';
          const color = returnToColor(value);
          return `
            <div style="font-family:${CHART_FONT.family}; min-width:150px">
              <div style="font-size:12px; font-weight:700; color:rgba(148,163,184,0.9); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.1em">${monthLabel} ${year}</div>
              <div style="font-size:18px; font-weight:900; color:${color}; font-variant-numeric:tabular-nums">${valueStr}</div>
            </div>
          `;
        },
      },
      grid: { top: 36, right: 16, bottom: 16, left: 56, containLabel: false },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: CHART_FONT.family,
          fontSize: 11,
          fontWeight: CHART_FONT.weightBold,
          color: 'rgba(148,163,184,0.85)',
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: yData,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: CHART_FONT.family,
          fontSize: 11,
          fontWeight: CHART_FONT.weightBold,
          color: 'rgba(148,163,184,0.85)',
        },
        splitLine: { show: false },
        inverse: true,
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData.map(([y, m, v]) => [m, yData.indexOf(String(y)), v]),
          itemStyle: {
            borderColor: 'rgba(15,20,40,0.5)',
            borderWidth: 2,
            borderRadius: 4,
          },
          emphasis: {
            itemStyle: {
              borderColor: 'rgba(255,255,255,0.3)',
              borderWidth: 3,
            },
          },
          visualMap: false,
          renderItem: (params: any, api: any) => {
            const [mIdx, yIdx, val] = params.data ?? [];
            const [x, y] = api.coord([mIdx, yIdx]);
            const bw = api.size([1, 0])[0];
            const bh = api.size([0, 1])[1];
            const padding = 3;

            return {
              type: 'rect',
              shape: {
                x: x - bw / 2 + padding,
                y: y - bh / 2 + padding,
                width: bw - padding * 2,
                height: bh - padding * 2,
                r: 4,
              },
              style: {
                fill: returnToColor(val),
                opacity: val === null ? 0.2 : 0.88,
              },
              emphasis: {
                style: {
                  fill: returnToColor(val),
                  opacity: 1,
                  shadowBlur: 12,
                  shadowColor: returnToColor(val),
                },
              },
              // Inline label
              textContent: {
                type: 'text',
                style: {
                  text: val !== null ? formatPercentage(val, 1) : '—',
                  fill: 'rgba(255,255,255,0.9)',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: CHART_FONT.family,
                  align: 'center',
                  verticalAlign: 'middle',
                },
              },
              textConfig: {
                position: 'inside',
              },
            };
          },
        },
      ],
    };

    instance.setOption(option);

    const observer = new ResizeObserver(() => instanceRef.current?.resize());
    observer.observe(chartRef.current!);
    resizeObserverRef.current = observer;
  }, [heatmapData, yData, isEmpty]);

  // yData reference fix
  const yData = years.map(String);

  useEffect(() => {
    if (!isEmpty && !loading) initChart();
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [initChart, isEmpty, loading]);

  const colorLegend = [
    { color: '#059669', label: '>10%' },
    { color: '#34d399', label: '>2%' },
    { color: '#6ee7b7', label: '>0%' },
    { color: '#475569', label: '0%' },
    { color: '#fca5a5', label: '<0%' },
    { color: '#f87171', label: '<-2%' },
    { color: '#dc2626', label: '<-10%' },
  ];

  return (
    <ChartContainer
      title="Mapa de Calor — Retornos"
      description="Rendimiento mensual histórico. Verde = positivo · Rojo = negativo"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Sin historial suficiente para mostrar el mapa de calor."
      onRetry={onRetry}
      chartHeight={chartHeight + 80}
      ariaLabel="Mapa de calor de retornos mensuales"
      className={className}
      footer={
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {colorLegend.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
              <span className="text-muted-foreground">{item.label}</span>
            </span>
          ))}
        </div>
      }
    >
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: `${chartHeight}px` }}
        role="img"
        aria-label="Heatmap de retornos mensuales"
      />
    </ChartContainer>
  );
}
