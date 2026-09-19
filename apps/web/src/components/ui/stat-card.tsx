import * as React from "react"
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "./card"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    value: string | number
    change?: number | string
    changeLabel?: string
    isPositive?: boolean
    icon?: LucideIcon
    subtitle?: string
}

export function StatCard({
    title,
    value,
    change,
    changeLabel,
    isPositive,
    icon: Icon,
    subtitle,
    className,
    ...props
}: StatCardProps) {
    const hasChange = change !== undefined && change !== null

    return (
        <Card
            variant="default"
            className={cn("p-4 sm:p-5 flex flex-col justify-between gap-3", className)}
            {...props}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {title}
                </span>
                {Icon && (
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0 shadow-2xs">
                        <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                )}
            </div>

            <div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground num">
                    {value}
                </div>

                {(hasChange || subtitle) && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {hasChange && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md num",
                                    isPositive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}
                            >
                                {isPositive ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                {typeof change === 'number' && change > 0 ? `+${change}` : change}
                                {typeof change === 'number' ? '%' : ''}
                            </span>
                        )}
                        {(changeLabel || subtitle) && (
                            <span className="text-xs text-muted-foreground truncate">
                                {changeLabel || subtitle}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
