/**
 * ChartContainer.tsx — Base chart wrapper for Finix charts library.
 *
 * Centralizes: theme, loading, errors, empty states, responsive, fullscreen, accessibility.
 * All specific chart components should be wrapped in ChartContainer.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartSkeleton } from './ChartSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';

export interface ChartContainerProps {
  /** Chart title shown in the header */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** The chart content */
  children: React.ReactNode;
  /** Is the chart currently loading? */
  loading?: boolean;
  /** Error message (shows error state) */
  error?: string | null;
  /** Whether there is no data to display */
  empty?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Optional action buttons shown in header (selectors, etc.) */
  headerActions?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Allow fullscreen toggle */
  allowFullscreen?: boolean;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
  /** Fixed height for the chart area */
  chartHeight?: number | string;
  /** aria-label for accessibility */
  ariaLabel?: string;
}

export function ChartContainer({
  title,
  description,
  children,
  loading = false,
  error = null,
  empty = false,
  emptyMessage,
  headerActions,
  footer,
  allowFullscreen = true,
  onRetry,
  className,
  chartHeight = 360,
  ariaLabel,
}: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!allowFullscreen) return;

    if (!isFullscreen && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen?.();
        setIsFullscreen(true);
      } catch {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      try {
        await document.exitFullscreen?.();
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen, allowFullscreen]);

  const heightStyle = isFullscreen
    ? { height: 'calc(100vh - 120px)' }
    : typeof chartHeight === 'number'
    ? { height: `${chartHeight}px` }
    : { height: chartHeight };

  return (
    <section
      ref={containerRef}
      role="region"
      aria-label={ariaLabel ?? title}
      className={cn(
        'rounded-[22px] border border-border/50 bg-card/80 shadow-lg overflow-hidden',
        'flex flex-col',
        isFullscreen && 'fixed inset-0 z-50 rounded-none bg-background',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border/40 px-5 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold tracking-tight text-foreground truncate" id={`chart-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug max-w-lg">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {headerActions}
          {onRetry && !loading && (
            <button
              onClick={onRetry}
              title="Actualizar datos"
              aria-label="Actualizar datos del gráfico"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/50 bg-background/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {allowFullscreen && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/50 bg-background/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              {isFullscreen
                ? <Minimize2 className="w-3.5 h-3.5" />
                : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div style={heightStyle} className="flex items-center justify-center p-4">
            <ChartSkeleton height={typeof chartHeight === 'number' ? chartHeight : 320} />
          </div>
        ) : error ? (
          <div style={heightStyle} className="flex items-center justify-center p-4">
            <ChartErrorState message={error} onRetry={onRetry} />
          </div>
        ) : empty ? (
          <div style={heightStyle} className="flex items-center justify-center p-4">
            <ChartEmptyState message={emptyMessage} />
          </div>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </div>

      {/* ── Footer ── */}
      {footer && (
        <div className="border-t border-border/30 px-5 py-3 sm:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}
