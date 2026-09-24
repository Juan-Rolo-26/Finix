/**
 * DrawdownChart.tsx — Portfolio Drawdown visualization
 *
 * Shows historical drawdown from peak. Calculates:
 *  - Peak histórico
 *  - Drawdown actual
 *  - Max drawdown
 *  - Fecha inicio y recuperación
 */

import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_COLORS } from '../utils/chartTheme';
import { formatPercentage, formatTooltipDate, formatCurrency, safeNum } from '../utils/chartFormatters';
import type { DrawdownStats } from '../utils/chartDataAdapters';

interface DrawdownChartProps {
  data?: DrawdownStats | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: string;
  className?: string;
}

function DrawdownTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const drawdown = payload[0]?.value ?? 0;
  return (
    <div style={CHART_TOOLTIP_STYLE as React.CSSProperties} className="space-y-1.5">
      <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </p>
      <p className={cn('text-lg font-black tabular-nums', drawdown < 0 ? 'text-red-400' : 'text-emerald-400')}>
        {formatPercentage(drawdown)}
      </p>
      <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '11px' }}>
        {drawdown < 0 ? `Caída desde el pico: ${Math.abs(drawdown).toFixed(2)}%` : 'En máximos históricos'}
      </p>
    </div>
  );
}

export function DrawdownChart({ data, loading, error, onRetry, currency = 'USD', className }: DrawdownChartProps) {
  const chartData = useMemo(() => {
    if (!data?.series?.length) return [];
    return data.series.map((pt) => ({
      date: pt.date,
      drawdown: safeNum(pt.drawdown),
    }));
  }, [data]);

  const isEmpty = !loading && !error && chartData.length === 0;

  const stats = useMemo(() => {
    if (!data) return null;
    return [
      { label: 'Max Drawdown', value: formatPercentage(data.maxDrawdown), color: 'text-red-400' },
      { label: 'DD Actual', value: formatPercentage(data.currentDrawdown), color: data.currentDrawdown < 0 ? 'text-red-400' : 'text-emerald-400' },
      { label: 'Peak valor', value: formatCurrency(data.peakValue, currency), color: 'text-foreground' },
      { label: 'Recuperación', value: data.recoveryDate ?? 'Pendiente', color: data.recoveryDate ? 'text-emerald-400' : 'text-amber-400' },
    ];
  }, [data, currency]);

  return (
    <ChartContainer
      title="Drawdown"
      description="Caída porcentual desde el pico máximo histórico del portafolio"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Sin historial suficiente para calcular el drawdown."
      onRetry={onRetry}
      chartHeight={320}
      ariaLabel="Gráfico de drawdown del portafolio"
      className={className}
    >
      {/* Stats strip */}
      {stats && (
        <div className="px-5 py-3 sm:px-6 border-b border-border/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</span>
              <span className={cn('mt-1 text-sm font-bold tabular-nums', stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-[280px] w-full px-3 py-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="drawdown-fill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={CHART_COLORS.negative} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS.negative} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.gridLine} strokeDasharray="4 8" vertical={false} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.35)" strokeWidth={1.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK as any}
              minTickGap={32}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK as any}
              width={52}
              tickMargin={8}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              domain={['dataMin', 0]}
            />
            <RechartsTooltip content={<DrawdownTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1.5 }} />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke={CHART_COLORS.negative}
              strokeWidth={2}
              fill="url(#drawdown-fill)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_COLORS.negative, fill: 'hsl(222 28% 7%)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Max drawdown annotation */}
      {data?.maxDrawdown !== undefined && data.maxDrawdown < 0 && (
        <div className="px-5 pb-3 sm:px-6 text-[11px] text-muted-foreground">
          <span>Máximo drawdown: </span>
          <span className="font-bold text-red-400">{formatPercentage(data.maxDrawdown)}</span>
          {data.maxDrawdownDate && (
            <span> el {formatTooltipDate(data.maxDrawdownDate)}</span>
          )}
        </div>
      )}
    </ChartContainer>
  );
}
