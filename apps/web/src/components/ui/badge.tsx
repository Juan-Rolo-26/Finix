import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    // Base: consistent font, spacing, border-radius — all badges look the same structurally
    "inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10.5px] font-semibold " +
    "tracking-[0.02em] select-none transition-colors duration-100 border",
    {
        variants: {
            variant: {
                // Primary / Brand
                default:
                    "bg-primary/10 text-primary border-primary/20",
                primary:
                    "bg-primary/10 text-primary border-primary/20",
                // Positive / success
                success:
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                positive:
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                // Warning
                warning:
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                // Danger / Negative
                destructive:
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                danger:
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                negative:
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                // Info
                info:
                    "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                // Neutral
                secondary:
                    "bg-secondary text-secondary-foreground border-border/60",
                neutral:
                    "bg-muted/60 text-muted-foreground border-border/50",
                // Outline — no fill
                outline:
                    "border-border bg-transparent text-foreground",
                // PRO / Premium
                premium:
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold",
                pro:
                    "bg-primary/10 text-primary border-primary/25 font-bold",
            },
            size: {
                default: "",
                sm: "text-[9.5px] px-1.5",
                lg: "text-xs px-2.5 py-1",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(badgeVariants({ variant, size }), className)}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
