import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
    // Base: border, background, overflow, transition
    "border transition-colors duration-150 text-card-foreground overflow-hidden",
    {
        variants: {
            variant: {
                // Standard: subtle border, flat bg
                default:
                    "rounded-[6px] border-border/80 bg-card",
                // Interactive: hover lift, border tightens
                interactive:
                    "rounded-[6px] border-border/70 bg-card cursor-pointer " +
                    "hover:border-border-strong hover:shadow-[0_2px_10px_hsl(var(--foreground)/0.06)] " +
                    "hover:-translate-y-px transition-all duration-150",
                // Elevated: slightly more shadow
                elevated:
                    "rounded-[6px] border-border/80 bg-card shadow-[0_2px_8px_hsl(var(--foreground)/0.05)]",
                // Ghost: invisible container
                ghost:
                    "rounded-[6px] border-transparent bg-transparent",
                // Metric: data-forward, tight padding via CardContent
                metric:
                    "rounded-[6px] border-border/70 bg-card",
                // Stat shorthand with built-in padding
                stat:
                    "rounded-[6px] border-border/70 bg-card p-4 flex flex-col justify-between",
                // Outlined with dashed border for empty states
                dashed:
                    "rounded-[6px] border-dashed border-border/70 bg-card/30",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(cardVariants({ variant, className }))}
            {...props}
        />
    )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1 p-4", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-sm font-semibold leading-snug tracking-tight text-foreground",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-xs text-muted-foreground leading-relaxed", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-4 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
