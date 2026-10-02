import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    actions?: React.ReactNode
    badge?: React.ReactNode
}

export function PageHeader({
    title,
    description,
    actions,
    badge,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center gap-4 pb-5 border-b border-border/60 mb-6",
                className
            )}
            {...props}
        >
            <div className="space-y-1 min-w-0 flex flex-col items-center text-center">
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground text-center truncate">
                        {title}
                    </h1>
                    {badge}
                </div>
                {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed text-center mx-auto">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center justify-center gap-2.5 shrink-0 flex-wrap">
                    {actions}
                </div>
            )}
        </div>
    )
}
