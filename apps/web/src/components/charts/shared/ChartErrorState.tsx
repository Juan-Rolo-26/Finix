/** ChartErrorState.tsx — Error state for Finix chart components */
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ChartErrorState({
  message = 'No se pudieron cargar los datos del gráfico.',
  onRetry,
  className,
}: ChartErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center gap-4 w-full h-full min-h-[220px]',
        'rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-8 text-center',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive/70">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-foreground/80">Error al cargar datos</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Reintentar carga de datos"
          className="inline-flex items-center gap-2 h-8 px-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive/80 text-xs font-semibold hover:bg-destructive/15 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
