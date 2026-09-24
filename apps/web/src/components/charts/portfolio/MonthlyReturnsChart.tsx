/**
 * MonthlyReturnsChart.tsx — Monthly returns bar chart
 *
 * Features:
 *  - Year selector (shows all available years)
 *  - Monthly bars colored by positive/negative
 *  - Annual cumulative return badge
 *  - Tooltip with month return %
 */

import React, { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { CHART_AXIS_TICK, CHART_COLORS, CHART_TOOLTIP_STYLE } from '../utils/chartTheme';
import { formatPercentage } from '../utils/chartFormatters';
import { groupReturnsByYear, type MonthlyReturn } from '../utils/chartDataAdapters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyReturnsChartProps {
  data?: MonthlyReturn[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const MONTH_LABELS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function MonthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const isPos = value >= 0;
  return (
    <div style={CHART_TOOLTIP_STYLE as React.CSSProperties} className="space-y-1">
      <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p className={cn('text-xl font-black tabular-nums', isPos ? 'text-emerald-400' : 'text-red-400')}>
        {formatPercentage(value)}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MonthlyReturnsChart({
  data,
  loading,
  error,
  onRetry,
  className,
}: MonthlyReturnsChartProps) {
  const byYear = useMemo(() => groupReturnsByYear(data ?? []), [data]);
  const availableYears = useMemo(() => Array.from(byYear.keys()).sort((a, b) => b - a), [byYear]);

  const [selectedYear, setSelectedYear] = useState<number>(() => availableYears[0] ?? new Date().getFullYear());

  const yearData = useMemo(() => {
    const months = byYear.get(selectedYear) ?? new Array(12).fill(null);
    return MONTH_LABELS_SHORT.map((label, i) => ({
      label,
      value: months[i] ?? null,
    }));
  }, [byYear, selectedYear]);

  // Annual compound return
  const annualReturn = useMemo(() => {
    const values = yearData.map((d) => d.value).filter((v): v is number => v !== null);
    if (!values.length) return null;
    return values.reduce((acc, r) => acc * (1 + r / 100), 1) * 100 - 100;
  }, [yearData]);

  const isEmpty = !loading && !error && availableYears.length === 0;

  // Y axis domain
  const allValues = yearData.map((d) => d.value ?? 0);
  const maxAbs = Math.max(Math.max(...allValues.map(Math.abs)), 1);
  const domainPad = Math.max(maxAbs * 0.3, 1);
  const yDomain: [number, number] = [-(maxAbs + domainPad), maxAbs + domainPad];

  return (
    <ChartContainer
      title="Retornos Mensuales"
      description="Rendimiento porcentual mensual. Composición anualizada con interés compuesto."
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Sin historial de retornos mensuales disponible."
      onRetry={onRetry}
      chartHeight={300}
      ariaLabel="Gráfico de retornos mensuales"
      className={className}
      headerActions={
        <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1" role="group" aria-label="Seleccionar año">
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              aria-pressed={selectedYear === year}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                selectedYear === year
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {year}
            </button>
          ))}
        </div>
      }
    >
      {/* Annual return badge */}
      {annualReturn !== null && (
        <div className="px-5 py-3 sm:px-6 border-b border-border/20 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Retorno {selectedYear}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-black tabular-nums border',
              annualReturn >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400',
            )}
          >
            {formatPercentage(annualReturn)}
          </span>
          <span className="text-[10px] text-muted-foreground">(compuesto)</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-[260px] w-full px-3 py-4 sm:px-4" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearData} margin={{ top: 16, right: 16, bottom: 4, left: 0 }} barCategoryGap="22%">
            <defs>
              <linearGradient id="month-bar-pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.positive} stopOpacity={0.95} />
                <stop offset="100%" stopColor={CHART_COLORS.positive} stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="month-bar-neg" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={CHART_COLORS.negative} stopOpacity={0.95} />
                <stop offset="100%" stopColor={CHART_COLORS.negative} stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.gridLine} strokeDasharray="4 8" vertical={false} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.35)" strokeWidth={1.5} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK as any}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK as any}
              width={44}
              tickMargin={6}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              domain={yDomain}
            />
            <RechartsTooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
            <Bar dataKey="value" radius={[5, 5, 5, 5]} maxBarSize={40}>
              {yearData.map((entry, index) => (
                <Cell
                  key={`month-${index}`}
                  fill={
                    entry.value === null
                      ? 'rgba(100,116,139,0.25)'
                      : entry.value >= 0
                      ? 'url(#month-bar-pos)'
                      : 'url(#month-bar-neg)'
                  }
                  style={{ opacity: entry.value === null ? 0.4 : 1 }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
