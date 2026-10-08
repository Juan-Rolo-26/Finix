import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: LucideIcon
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
    /** Use compact mode for inline empty states (e.g. inside table rows) */
    compact?: boolean
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    compact = false,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center select-none",
                compact
                    ? "p-6 gap-2"
                    : "p-10 gap-3 rounded-[6px] border border-dashed border-border/60 bg-card/30 my-3",
                className
            )}
            {...props}
        >
            <div className={cn(
                "flex items-center justify-center rounded-[5px] bg-muted/50 text-muted-foreground/60 mb-0.5",
                compact ? "w-9 h-9" : "w-10 h-10"
            )}>
                <Icon className={cn("stroke-[1.5]", compact ? "w-4.5 h-4.5" : "w-5 h-5")} />
            </div>
            <div className="space-y-1">
                <h3 className={cn(
                    "font-semibold text-foreground",
                    compact ? "text-xs" : "text-sm"
                )}>
                    {title}
                </h3>
                {description && (
                    <p className={cn(
                        "text-muted-foreground leading-relaxed max-w-xs",
                        compact ? "text-[10.5px]" : "text-xs"
                    )}>
                        {description}
                    </p>
                )}
            </div>
            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    size={compact ? "sm" : "default"}
                    className="mt-1"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
