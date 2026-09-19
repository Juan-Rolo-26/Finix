import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-primary/15 text-primary border border-primary/25",
                primary:
                    "bg-primary/15 text-primary border border-primary/25",
                success:
                    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
                warning:
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
                destructive:
                    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
                danger:
                    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
                info:
                    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25",
                secondary:
                    "bg-secondary text-secondary-foreground border border-border/70",
                outline:
                    "border border-border bg-background/50 text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
