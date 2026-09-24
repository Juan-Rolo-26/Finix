/** ChartEmptyState.tsx — Empty data state for Finix chart components */
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartEmptyStateProps {
  message?: string;
  className?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export function ChartEmptyState({
  message = 'No hay datos suficientes para mostrar este gráfico.',
  hint,
  className,
  icon,
}: ChartEmptyStateProps) {
  return (
    <div
      role="status"
      aria-label="Sin datos"
      className={cn(
        'flex flex-col items-center justify-center gap-4 w-full h-full min-h-[220px]',
        'rounded-2xl border border-dashed border-border/60 bg-muted/10 px-8 text-center',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary/60">
        {icon ?? <BarChart3 className="w-6 h-6" aria-hidden="true" />}
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-foreground/80">{message}</p>
        {hint && (
          <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
        )}
      </div>
    </div>
  );
}
