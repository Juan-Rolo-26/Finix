import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Base skeleton shimmer — use for any loading placeholder.
 * The shimmer animation is defined in index.css as .skeleton-shimmer
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-[4px] bg-muted/50 dark:bg-muted/35 " +
                "relative overflow-hidden " +
                "before:absolute before:inset-0 " +
                "before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.04] before:to-transparent " +
                "before:animate-[shimmer_1.8s_ease-in-out_infinite] " +
                "before:translate-x-[-100%]",
                className
            )}
            aria-hidden="true"
            {...props}
        />
    )
}

/**
 * Pre-composed skeleton variants for common Finix patterns
 */
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("rounded-[6px] border border-border/50 bg-card p-4 space-y-3", className)}
            {...props}
        >
            <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
        </div>
    )
}

function SkeletonTable({ rows = 5, cols = 4, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number; cols?: number }) {
    return (
        <div
            className={cn("rounded-[6px] border border-border/50 bg-card overflow-hidden", className)}
            {...props}
        >
            {/* Header */}
            <div className="flex gap-4 px-3 h-9 items-center border-b border-border/40 bg-muted/20">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-2.5 flex-1" style={{ opacity: 0.6 }} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 px-3 h-10 items-center border-b border-border/30 last:border-b-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} className={cn("h-3 flex-1", c === 0 ? "max-w-[120px]" : "")} />
                    ))}
                </div>
            ))}
        </div>
    )
}

function SkeletonMetric({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("rounded-[6px] border border-border/50 bg-card p-4 space-y-2", className)} {...props}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-2.5 w-16" />
        </div>
    )
}

function SkeletonText({ lines = 3, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-3"
                    style={{ width: i === lines - 1 ? '65%' : `${85 + Math.random() * 15}%` }}
                />
            ))}
        </div>
    )
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonMetric, SkeletonText }
