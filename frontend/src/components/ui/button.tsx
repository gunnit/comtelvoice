import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center whitespace-nowrap font-semibold",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        // Variants
        {
          // Default - Primary button with glow effect
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-glow":
            variant === "default",
          // Secondary
          "bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          // Destructive
          "bg-destructive text-destructive-foreground hover:bg-destructive/90":
            variant === "destructive",
          // Outline
          "border border-border/50 bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-primary/30":
            variant === "outline",
          // Ghost
          "hover:bg-accent hover:text-accent-foreground":
            variant === "ghost",
          // Link
          "text-primary underline-offset-4 hover:underline":
            variant === "link",
        },
        // Sizes
        {
          "h-10 px-5 py-2 text-sm rounded-xl": size === "default",
          "h-8 px-3 text-xs rounded-lg": size === "sm",
          "h-12 px-8 text-base rounded-xl": size === "lg",
          "h-10 w-10 rounded-xl": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
}
