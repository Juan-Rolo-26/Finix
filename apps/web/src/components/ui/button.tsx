import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    // Base: consistent height, font, transitions, focus ring
    "finix-button inline-flex items-center justify-center whitespace-nowrap font-medium select-none cursor-pointer " +
    "transition-all duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-40",
    {
        variants: {
            variant: {
                // Primary — Finix green
                default:
                    "finix-button--primary bg-primary text-primary-foreground font-semibold border border-transparent " +
                    "hover:bg-primary/90 active:scale-[0.98] active:bg-primary/85",
                primary:
                    "finix-button--primary bg-primary text-primary-foreground font-semibold border border-transparent " +
                    "hover:bg-primary/90 active:scale-[0.98] active:bg-primary/85",
                // Destructive
                destructive:
                    "finix-button--danger bg-destructive text-destructive-foreground font-semibold border border-transparent " +
                    "hover:bg-destructive/90 active:scale-[0.98]",
                // Outline — visible border, transparent bg
                outline:
                    "finix-button--neutral border border-border bg-transparent text-foreground " +
                    "hover:bg-secondary hover:border-border-strong active:scale-[0.98]",
                // Secondary — subtle filled
                secondary:
                    "finix-button--neutral border border-border/60 bg-secondary text-secondary-foreground " +
                    "hover:bg-secondary/75 hover:border-border active:scale-[0.98]",
                // Ghost — no border, no bg until hover
                ghost:
                    "finix-button--neutral text-muted-foreground border border-transparent " +
                    "hover:text-foreground hover:bg-secondary/60 active:scale-[0.98]",
                // Link — text only
                link:
                    "finix-button--neutral text-primary underline-offset-4 hover:underline p-0 h-auto border-0",
                // Danger ghost
                danger:
                    "finix-button--danger text-danger border border-transparent " +
                    "hover:bg-danger/8 hover:border-danger/20 active:scale-[0.98]",
            },
            size: {
                // Desktop-optimized sizes: tighter heights, consistent padding
                default: "h-9 px-3.5 py-2 text-sm rounded-md gap-1.5",
                sm:      "h-7.5 px-2.5 text-xs rounded gap-1",
                lg:      "h-10 px-5 text-sm rounded-md gap-2",
                xl:      "h-11 px-6 text-base rounded-md gap-2",
                icon:    "h-9 w-9 rounded-md p-0",
                "icon-sm": "h-7.5 w-7.5 rounded p-0",
                "icon-lg": "h-10 w-10 rounded-md p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
        if (asChild) {
            return (
                <Slot
                    aria-disabled={disabled || isLoading || undefined}
                    aria-busy={isLoading || undefined}
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                >
                    {children}
                </Slot>
            )
        }

        return (
            <button
                aria-busy={isLoading || undefined}
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
                )}
                {!isLoading && leftIcon && (
                    <span className="shrink-0 flex items-center">{leftIcon}</span>
                )}
                {children}
                {!isLoading && rightIcon && (
                    <span className="shrink-0 flex items-center">{rightIcon}</span>
                )}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
