import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-45 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 active:scale-[0.98] border border-transparent",
                primary:
                    "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 active:scale-[0.98] border border-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground font-semibold shadow-xs hover:bg-destructive/90 active:scale-[0.98] border border-transparent",
                outline:
                    "border border-border/80 bg-background/60 text-foreground font-medium hover:bg-secondary hover:text-foreground hover:border-border active:scale-[0.98]",
                secondary:
                    "border border-border/70 bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 hover:border-border active:scale-[0.98]",
                ghost:
                    "text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-[0.98] border border-transparent",
                link:
                    "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium border-0",
            },
            size: {
                default: "h-10 px-4 py-2 rounded-xl gap-2",
                sm: "h-8.5 px-3 text-xs rounded-lg gap-1.5",
                lg: "h-11.5 px-6 text-base rounded-xl gap-2.5",
                icon: "h-10 w-10 rounded-xl p-0",
                "icon-sm": "h-8.5 w-8.5 rounded-lg p-0",
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
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
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
