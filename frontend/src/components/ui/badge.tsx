import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200",
        {
          // Default - primary color
          "border-transparent bg-primary/15 text-primary":
            variant === "default",
          // Secondary
          "border-transparent bg-secondary text-secondary-foreground":
            variant === "secondary",
          // Destructive
          "border-destructive/30 bg-destructive/15 text-destructive":
            variant === "destructive",
          // Outline
          "border-border/50 text-foreground bg-transparent":
            variant === "outline",
          // Success
          "border-success/30 bg-success/15 text-success":
            variant === "success",
          // Warning
          "border-warning/30 bg-warning/15 text-warning":
            variant === "warning",
          // Info
          "border-info/30 bg-info/15 text-info":
            variant === "info",
        },
        className
      )}
      {...props}
    />
  )
}
