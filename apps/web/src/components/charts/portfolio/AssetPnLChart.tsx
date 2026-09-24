/**
 * AssetPnLChart.tsx — Horizontal bar chart showing P&L per asset.
 *
 * Features:
 *  - Sortable by: Rendimiento % | P&L absoluto | Peso
 *  - Vista: barras horizontales ordenadas
 *  - Color positivo/negativo
 *  - Tooltip completo
 */

import React, { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpDown, DollarSign, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_AXIS_TICK, CHART_COLORS, CHART_TOOLTIP_STYLE } from '../utils/chartTheme';
import { formatPercentage, formatCurrency, formatCompactCurrency } from '../utils/chartFormatters';
import { sortAssetsByReturn, type AssetPnLItem } from '../utils/chartDataAdapters';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortMetric = 'returnPct' | 'pnlUsd' | 'pnlArs';

interface AssetPnLChartProps {
  data?: AssetPnLItem[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: string;
  className?: string;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function AssetPnLTooltip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as AssetPnLItem | undefined;
  if (!item) return null;
  const isPos = item.returnPct >= 0;

  return (
    <div style={CHART_TOOLTIP_STYLE as React.CSSProperties} className="space-y-2">
      <div className="border-b border-white/10 pb-2">
        <p className="font-black text-sm text-foreground">{item.ticker}</p>
        {item.name && <p className="text-[11px] text-muted-foreground">{item.name}</p>}
      </div>
      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Rendimiento</span>
          <span className={cn('font-black', isPos ? 'text-emerald-400' : 'text-red-400')}>
            {formatPercentage(item.returnPct)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">P&L</span>
          <span className={cn('font-bold', isPos ? 'text-emerald-400' : 'text-red-400')}>
            {formatCurrency(item.pnlUsd, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor actual</span>
          <span className="font-bold text-foreground">{formatCurrency(item.currentValue, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Costo</span>
          <span className="font-bold text-foreground/75">{formatCurrency(item.costBasis, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Peso</span>
          <span className="font-bold text-amber-400">{formatPercentage(item.weight, 1, false)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AssetPnLChart({
  data,
  loading,
  error,
  onRetry,
  currency = 'USD',
  className,
}: AssetPnLChartProps) {
  const [sortBy, setSortBy] = useState<SortMetric>('returnPct');

  const chartData = useMemo(() => {
    const sorted = sortAssetsByReturn(data ?? [], sortBy);
    return sorted.map((item) => ({
      ...item,
      displayValue: sortBy === 'returnPct' ? item.returnPct
        : sortBy === 'pnlUsd' ? item.pnlUsd
        : (item.pnlArs ?? 0),
    }));
  }, [data, sortBy]);

  const isEmpty = !loading && !error && chartData.length === 0;
  const maxAbsValue = useMemo(() => Math.max(...chartData.map((d) => Math.abs(d.displayValue)), 1), [chartData]);

  // Dynamic row height
  const chartHeight = Math.max(280, Math.min(chartData.length * 42 + 60, 600));

  const sortButtons: { key: SortMetric; label: string; icon: React.ReactNode }[] = [
    { key: 'returnPct', label: 'Rend. %', icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
    { key: 'pnlUsd', label: 'P&L USD', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: 'pnlArs', label: 'P&L ARS', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <ChartContainer
      title="Rendimiento por Activo"
      description="Retorno y ganancia/pérdida individual de cada posición"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="No hay posiciones con datos de rendimiento."
      onRetry={onRetry}
      chartHeight={chartHeight + 80}
      ariaLabel="Gráfico de rendimiento por activo"
      className={className}
      headerActions={
        <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1" role="group" aria-label="Ordenar por">
          {sortButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setSortBy(btn.key)}
              aria-pressed={sortBy === btn.key}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                sortBy === btn.key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="px-2 py-4 sm:px-3" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 80, bottom: 4, left: 4 }}
            barSize={22}
            barCategoryGap="28%"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK as any}
              tickMargin={6}
              domain={[-maxAbsValue * 1.3, maxAbsValue * 1.3]}
              tickFormatter={(v: number) => sortBy === 'returnPct' ? `${v.toFixed(0)}%` : formatCompactCurrency(v, currency)}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              axisLine={false}
              tickLine={false}
              tick={{ ...CHART_AXIS_TICK, fontSize: 11.5, fontWeight: 700 } as any}
              width={60}
            />
            <ReferenceLine x={0} stroke="rgba(148,163,184,0.35)" strokeWidth={1.5} />
            <RechartsTooltip
              content={<AssetPnLTooltip currency={currency} />}
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            />
            <Bar dataKey="displayValue" radius={[0, 5, 5, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`pnl-${entry.ticker}-${index}`}
                  fill={entry.displayValue >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative}
                  opacity={0.88}
                />
              ))}
              <LabelList
                dataKey="displayValue"
                position="right"
                formatter={(v: number) => sortBy === 'returnPct' ? formatPercentage(v, 1) : formatCompactCurrency(v, currency)}
                style={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
