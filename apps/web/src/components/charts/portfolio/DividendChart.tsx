/**
 * DividendChart.tsx — Dividend income history bar chart
 *
 * Shows:
 *  - Monthly dividend income bars
 *  - Accumulated dividend line
 *  - By-asset breakdown
 *  - Yield estimation
 */

import React, { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_AXIS_TICK, CHART_COLORS, CHART_TOOLTIP_STYLE } from '../utils/chartTheme';
import { formatCurrency, formatCompactCurrency, formatPercentage } from '../utils/chartFormatters';
import type { DividendData } from '../utils/chartDataAdapters';

interface DividendChartProps {
  data?: DividendData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: string;
  className?: string;
}

type ViewMode = 'monthly' | 'byAsset';

function DividendTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE as React.CSSProperties} className="space-y-1.5">
      <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-bold tabular-nums" style={{ color: p.color }}>
            {typeof p.value === 'number' ? formatCurrency(p.value, currency) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DividendChart({ data, loading, error, onRetry, currency = 'USD', className }: DividendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const monthlyData = useMemo(() => data?.byMonth ?? [], [data]);
  const assetData = useMemo(() => data?.byAsset?.slice(0, 12) ?? [], [data]);

  const isEmpty = !loading && !error && !data?.totalReceived;

  return (
    <ChartContainer
      title="Dividendos e Ingresos"
      description="Dividendos cobrados por período"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Sin dividendos registrados."
      onRetry={onRetry}
      chartHeight={320}
      ariaLabel="Gráfico de dividendos"
      className={className}
      headerActions={
        <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1" role="group" aria-label="Vista de dividendos">
          {([
            { key: 'monthly', label: 'Por mes' },
            { key: 'byAsset', label: 'Por activo' },
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
      }
    >
      {/* Stats strip */}
      <div className="px-5 py-3 sm:px-6 border-b border-border/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total cobrado</span>
          <span className="mt-1 text-sm font-black tabular-nums text-emerald-400">{formatCurrency(data?.totalReceived ?? 0, currency)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Yield estimado</span>
          <span className="mt-1 text-sm font-black tabular-nums text-sky-400">{formatPercentage(data?.estimatedYield ?? 0, 1)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Activos pagadores</span>
          <span className="mt-1 text-sm font-black text-foreground">{data?.byAsset?.length ?? 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Pagos registrados</span>
          <span className="mt-1 text-sm font-black text-foreground">{data?.confirmed?.length ?? 0}</span>
        </div>
      </div>

      {/* Chart */}
      {viewMode === 'monthly' ? (
        <div className="h-[240px] w-full px-3 py-4 sm:px-4" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.gridLine} strokeDasharray="4 8" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={CHART_AXIS_TICK as any} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tick={CHART_AXIS_TICK as any} width={64} tickMargin={6} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
              <RechartsTooltip content={<DividendTooltip currency={currency} />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
              <Bar dataKey="amount" name="Dividendos" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.series[2]} opacity={0.85} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="amount"
                name="Tendencia"
                stroke={CHART_COLORS.positive}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[240px] w-full px-3 py-4 sm:px-4" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={assetData}
              layout="vertical"
              margin={{ top: 4, right: 80, bottom: 4, left: 4 }}
              barSize={20}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={CHART_AXIS_TICK as any}
                tickFormatter={(v) => formatCompactCurrency(v, currency)}
              />
              <YAxis
                type="category"
                dataKey="ticker"
                axisLine={false}
                tickLine={false}
                tick={{ ...CHART_AXIS_TICK, fontSize: 11.5, fontWeight: 700 } as any}
                width={60}
              />
              <RechartsTooltip content={<DividendTooltip currency={currency} />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
              <Bar dataKey="total" name="Total cobrado" radius={[0, 5, 5, 0]} fill={CHART_COLORS.series[2]} opacity={0.88} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartContainer>
  );
}
