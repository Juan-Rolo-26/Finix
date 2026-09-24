/** ChartLegend.tsx — Reusable chart legend component */
import { cn } from '@/lib/utils';

export interface LegendItem {
  color: string;
  label: string;
  value?: string;
  description?: string;
  dashed?: boolean;
}

interface ChartLegendProps {
  items: LegendItem[];
  className?: string;
  columns?: 1 | 2 | 3;
  compact?: boolean;
}

export function ChartLegend({ items, className, columns = 2, compact = false }: ChartLegendProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <div
      role="list"
      aria-label="Leyenda del gráfico"
      className={cn('grid gap-2', gridClass, className)}
    >
      {items.map((item) => (
        <div
          key={item.label}
          role="listitem"
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40',
            compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {item.dashed ? (
              <svg width="14" height="8" aria-hidden="true" className="shrink-0">
                <line
                  x1="0" y1="4" x2="14" y2="4"
                  stroke={item.color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </svg>
            ) : (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <span className={cn('block truncate text-foreground/90', compact ? 'text-xs' : 'text-sm')}>
                {item.label}
              </span>
              {item.description && (
                <span className="block truncate text-[10px] text-muted-foreground">
                  {item.description}
                </span>
              )}
            </div>
          </div>
          {item.value && (
            <span className={cn('shrink-0 font-mono font-semibold text-muted-foreground', compact ? 'text-xs' : 'text-xs')}>
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
