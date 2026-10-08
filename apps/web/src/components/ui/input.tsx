import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    isError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, isError, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Base layout
                    "flex h-9 w-full rounded-[5px] border bg-card/60 px-3 py-2 " +
                    "text-sm text-foreground placeholder:text-muted-foreground/50 " +
                    // Border states
                    "border-border hover:border-border-strong " +
                    // Focus
                    "transition-colors duration-150 " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:border-primary/70 " +
                    // Disabled
                    "disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-muted/20 " +
                    // Shadow
                    "shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)]",
                    isError && "border-destructive/70 focus-visible:ring-destructive/30 focus-visible:border-destructive text-destructive",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
