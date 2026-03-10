import * as React from "react"

import { cn } from "@/lib/utils"

const Badge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "secondary" | "destructive" | "outline"
    }
>(({ className, variant = "default", ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
                        variant === "default",
                    "border-brand/20 bg-brand/10 text-brand hover:bg-brand/15":
                        variant === "secondary",
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80":
                        variant === "destructive",
                    "border-border/80 bg-background/60 text-foreground": variant === "outline",
                },
                className
            )}
            {...props}
        />
    )
})
Badge.displayName = "Badge"

export { Badge }
