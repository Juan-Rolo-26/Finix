/**
 * RiskReturnChart.tsx — Risk vs Return scatter chart using Apache ECharts.
 *
 * X axis: Volatility (annualized std dev)
 * Y axis: Return %
 * Size: Portfolio weight
 * Shows individual assets + portfolio aggregate
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_FONT, CHART_COLORS, ECHARTS_BASE_THEME } from '../utils/chartTheme';
import { formatPercentage } from '../utils/chartFormatters';
import type { RiskReturnItem } from '../utils/chartDataAdapters';

interface RiskReturnChartProps {
  data?: RiskReturnItem[] | null;
  portfolioPoint?: { volatility: number; returnPct: number } | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function RiskReturnChart({
  data,
  portfolioPoint,
  loading,
  error,
  onRetry,
  className,
}: RiskReturnChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const isEmpty = !loading && !error && (!data?.length);

  const initChart = useCallback(async () => {
    if (!chartRef.current || isEmpty || !data?.length) return;

    const echarts = await import('echarts/core');
    const { ScatterChart } = await import('echarts/charts');
    const { TooltipComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent } = await import('echarts/components');
    const { CanvasRenderer } = await import('echarts/renderers');

    echarts.use([ScatterChart, TooltipComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, CanvasRenderer]);

    if (instanceRef.current) instanceRef.current.dispose();

    const instance = echarts.init(chartRef.current!, null, { renderer: 'canvas' });
    instanceRef.current = instance;

    // Normalize bubble size: max weight → max radius 40, min radius 10
    const maxWeight = Math.max(...data.map((d) => d.weight), 1);
    const scaleSize = (w: number) => Math.max(10, (w / maxWeight) * 40);

    const assetSeries = data.map((item) => ({
      name: item.ticker,
      value: [item.volatility, item.returnPct, item.weight, item.ticker, item.name ?? item.ticker, item.sharpe ?? 0],
      symbolSize: scaleSize(item.weight),
      itemStyle: {
        color: item.returnPct >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative,
        opacity: 0.82,
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5,
      },
    }));

    const portfolioSeries = portfolioPoint
      ? [{
          name: 'Portafolio',
          value: [portfolioPoint.volatility, portfolioPoint.returnPct, 100, 'Portafolio', 'Total del Portafolio', null],
          symbolSize: 48,
          symbol: 'diamond',
          itemStyle: {
            color: CHART_COLORS.series[1],
            borderColor: 'rgba(255,255,255,0.4)',
            borderWidth: 2.5,
            shadowBlur: 16,
            shadowColor: CHART_COLORS.series[1],
          },
        }]
      : [];

    const option = {
      ...ECHARTS_BASE_THEME,
      tooltip: {
        ...ECHARTS_BASE_THEME.tooltip,
        formatter: (params: any) => {
          const [vol, ret, weight, ticker, name, sharpe] = params.data?.value ?? [];
          const isPos = ret >= 0;
          const retColor = isPos ? '#34d399' : '#f87171';
          return `
            <div style="font-family:${CHART_FONT.family}; min-width:190px">
              <div style="font-size:13px; font-weight:800; color:#f8fafc; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1)">
                ${ticker} ${name !== ticker ? `<span style="opacity:0.6; font-size:11px; font-weight:500">— ${name}</span>` : ''}
              </div>
              <div style="display:flex; flex-direction:column; gap:5px; font-size:12px; font-variant-numeric:tabular-nums">
                <div style="display:flex; justify-content:space-between; gap:16px">
                  <span style="color:rgba(148,163,184,0.85)">Rendimiento</span>
                  <span style="font-weight:800; color:${retColor}">${formatPercentage(ret)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px">
                  <span style="color:rgba(148,163,184,0.85)">Volatilidad</span>
                  <span style="font-weight:700; color:#f8fafc">${formatPercentage(vol, 1, false)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px">
                  <span style="color:rgba(148,163,184,0.85)">Peso</span>
                  <span style="font-weight:700; color:#f59e0b">${formatPercentage(weight, 1, false)}</span>
                </div>
                ${sharpe !== null ? `
                <div style="display:flex; justify-content:space-between; gap:16px">
                  <span style="color:rgba(148,163,184,0.85)">Sharpe Ratio</span>
                  <span style="font-weight:700; color:#f8fafc">${Number(sharpe).toFixed(2)}</span>
                </div>` : ''}
              </div>
            </div>
          `;
        },
      },
      grid: { top: 24, right: 20, bottom: 40, left: 52, containLabel: false },
      xAxis: {
        type: 'value',
        name: 'Volatilidad (%)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: 'rgba(148,163,184,0.7)', fontFamily: CHART_FONT.family, fontSize: 11, fontWeight: 600 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: CHART_COLORS.gridLine } },
        axisLabel: { fontFamily: CHART_FONT.family, fontSize: 11, color: 'rgba(148,163,184,0.85)', formatter: (v: number) => `${v.toFixed(0)}%` },
      },
      yAxis: {
        type: 'value',
        name: 'Rendimiento (%)',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: { color: 'rgba(148,163,184,0.7)', fontFamily: CHART_FONT.family, fontSize: 11, fontWeight: 600 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: CHART_COLORS.gridLine } },
        axisLabel: { fontFamily: CHART_FONT.family, fontSize: 11, color: 'rgba(148,163,184,0.85)', formatter: (v: number) => `${v.toFixed(0)}%` },
      },
      series: [
        {
          type: 'scatter',
          name: 'Activos',
          data: assetSeries,
          label: {
            show: true,
            formatter: (p: any) => p.data.value[3],
            position: 'top',
            fontFamily: CHART_FONT.family,
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(248,250,252,0.8)',
          },
          markLine: {
            silent: true,
            lineStyle: { color: 'rgba(148,163,184,0.2)', type: 'dashed' },
            data: [{ yAxis: 0 }],
          },
          animation: true,
          animationDuration: 600,
          animationEasing: 'cubicOut',
        },
        ...(portfolioSeries.length
          ? [{
              type: 'scatter',
              name: 'Portafolio',
              data: portfolioSeries,
              label: {
                show: true,
                formatter: 'Portfolio',
                position: 'top',
                fontFamily: CHART_FONT.family,
                fontSize: 11,
                fontWeight: 700,
                color: CHART_COLORS.series[1],
              },
            }]
          : []),
      ],
    };

    instance.setOption(option as any);

    const observer = new ResizeObserver(() => instanceRef.current?.resize());
    observer.observe(chartRef.current!);
    resizeObserverRef.current = observer;
  }, [data, portfolioPoint, isEmpty]);

  useEffect(() => {
    if (!isEmpty && !loading) initChart();
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [initChart, isEmpty, loading]);

  return (
    <ChartContainer
      title="Riesgo vs Rendimiento"
      description="Tamaño = peso en portafolio · Eje X = volatilidad anualizada · Eje Y = rendimiento acumulado"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Sin datos suficientes para el análisis riesgo/rendimiento."
      onRetry={onRetry}
      chartHeight={380}
      ariaLabel="Gráfico de riesgo vs rendimiento por activo"
      className={className}
    >
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: '380px' }}
        role="img"
        aria-label="Scatter plot riesgo vs rendimiento"
      />
    </ChartContainer>
  );
}
