import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "default" | "lg" | "xl"
}

export function Spinner({ size = "default", className, ...props }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-10 h-10",
    }

    return (
        <div
            role="status"
            aria-label="Cargando"
            className={cn("flex items-center justify-center text-primary", className)}
            {...props}
        >
            <Loader2 className={cn("animate-spin", sizeClasses[size])} />
            <span className="sr-only">Cargando...</span>
        </div>
    )
}
