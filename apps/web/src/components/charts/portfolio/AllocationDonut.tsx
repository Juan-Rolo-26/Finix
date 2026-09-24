/**
 * AllocationDonut.tsx — Portfolio allocation donut chart
 *
 * Displays portfolio composition with grouping by:
 * asset | sector | industry | country | type | currency
 */

import React, { useState, useMemo } from 'react';
import {
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ChartContainer } from '../shared/ChartContainer';
import { ChartLegend } from '../shared/ChartLegend';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '../utils/chartTheme';
import { formatCurrency, formatPercentage, formatCompactCurrency, safeNum } from '../utils/chartFormatters';
import type { AllocationData } from '../utils/chartDataAdapters';

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupBy = 'asset' | 'sector' | 'industry' | 'country' | 'type' | 'currency';

interface AllocationDonutProps {
  data?: AllocationData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onGroupByChange?: (groupBy: GroupBy) => void;
  currency?: string;
  className?: string;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function AllocationTooltip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div style={CHART_TOOLTIP_STYLE as React.CSSProperties} className="space-y-2">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <span className="font-black text-sm text-foreground">{entry.name}</span>
        {entry.ticker && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
            {entry.ticker}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs font-mono">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-bold text-foreground">{formatCurrency(entry.value, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Peso</span>
          <span className="font-bold text-emerald-400">{formatPercentage(entry.percent, 2, false)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Center Label ─────────────────────────────────────────────────────────────

function CenterLabel({ total, currency, label }: { total: number; currency: string; label: string }) {
  return (
    <>
      <text
        x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'rgba(148,163,184,0.85)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {label}
      </text>
      <text
        x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'rgb(248,250,252)', fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em' }}
      >
        {formatCompactCurrency(total, currency)}
      </text>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const GROUP_BY_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'asset', label: 'Activo' },
  { key: 'sector', label: 'Sector' },
  { key: 'industry', label: 'Industria' },
  { key: 'country', label: 'País' },
  { key: 'type', label: 'Tipo' },
  { key: 'currency', label: 'Moneda' },
];

export function AllocationDonut({
  data,
  loading,
  error,
  onRetry,
  onGroupByChange,
  currency = 'USD',
  className,
}: AllocationDonutProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('asset');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const items = data?.items ?? [];
    const total = data?.total ?? items.reduce((s, i) => s + i.value, 0);
    return items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        name: item.name,
        ticker: item.ticker,
        value: safeNum(item.value),
        percent: total > 0 ? (item.value / total) * 100 : 0,
        color: CHART_COLORS.series[idx % CHART_COLORS.series.length],
      }));
  }, [data]);

  const total = data?.total ?? chartData.reduce((s, i) => s + i.value, 0);
  const isEmpty = !loading && !error && chartData.length === 0;

  const handleGroupChange = (g: GroupBy) => {
    setGroupBy(g);
    onGroupByChange?.(g);
  };

  const legendItems = chartData.map((item) => ({
    color: item.color,
    label: item.ticker ? `${item.ticker} — ${item.name}` : item.name,
    value: `${item.percent.toFixed(1)}%`,
  }));

  return (
    <ChartContainer
      title="Distribución del Portafolio"
      description="Composición por activo, sector o tipo de activo"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="Agregá activos a tu portafolio para ver la distribución."
      onRetry={onRetry}
      ariaLabel="Gráfico de distribución del portafolio"
      className={className}
      headerActions={
        <div
          className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-background/50 p-1 overflow-x-auto"
          role="group"
          aria-label="Agrupar por"
        >
          {GROUP_BY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleGroupChange(opt.key)}
              aria-pressed={groupBy === opt.key}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer',
                groupBy === opt.key
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
      <div className="space-y-4 p-5 sm:p-6">
        {/* Donut chart */}
        <div className="h-[260px] w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={100}
                paddingAngle={chartData.length === 1 ? 0 : 3}
                stroke="none"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`alloc-${entry.name}-${index}`}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                    stroke={activeIndex === index ? 'rgba(255,255,255,0.15)' : 'none'}
                    strokeWidth={activeIndex === index ? 3 : 0}
                  />
                ))}
                <CenterLabel
                  total={total}
                  currency={currency}
                  label={GROUP_BY_OPTIONS.find((g) => g.key === groupBy)?.label ?? 'Total'}
                />
              </Pie>
              <RechartsTooltip
                content={<AllocationTooltip currency={currency} />}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ChartLegend items={legendItems} columns={2} compact />
      </div>
    </ChartContainer>
  );
}
