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
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-border/80 bg-card/40 my-4 select-none",
                className
            )}
            {...props}
        >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3.5 shadow-2xs">
                <Icon className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
                {title}
            </h3>
            {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
