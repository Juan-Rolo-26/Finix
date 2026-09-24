/** ChartSkeleton.tsx — Animated loading skeleton for charts */
import React from 'react';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  height?: number;
  className?: string;
  showBars?: boolean;
}

export function ChartSkeleton({ height = 320, className, showBars = true }: ChartSkeletonProps) {
  return (
    <div
      className={cn('w-full animate-pulse', className)}
      style={{ height }}
      role="progressbar"
      aria-label="Cargando gráfico"
      aria-busy="true"
    >
      {showBars ? (
        <div className="w-full h-full flex flex-col justify-end gap-0 relative overflow-hidden rounded-xl bg-muted/20 border border-border/30">
          {/* Simulated line chart */}
          <svg
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full opacity-30"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="skeleton-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d="M0 160 C40 140 60 170 100 130 C140 90 160 150 200 110 C240 70 260 100 300 80 C340 60 370 90 400 70 L400 200 L0 200 Z"
              fill="url(#skeleton-grad)"
              className="text-primary"
            />
            <path
              d="M0 160 C40 140 60 170 100 130 C140 90 160 150 200 110 C240 70 260 100 300 80 C340 60 370 90 400 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />
          </svg>

          {/* Horizontal grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <div
              key={ratio}
              className="absolute left-0 right-0 h-px bg-border/30"
              style={{ bottom: `${ratio * 100}%` }}
            />
          ))}

          {/* Y axis skeleton */}
          <div className="absolute left-3 inset-y-4 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-2 w-10 rounded bg-muted/40" />
            ))}
          </div>

          {/* X axis skeleton */}
          <div className="absolute bottom-3 left-12 right-3 flex justify-between">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-2 w-8 rounded bg-muted/40" />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-muted/20 border border-border/30" />
      )}
    </div>
  );
}
