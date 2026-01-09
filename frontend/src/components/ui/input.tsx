import { cn } from "@/lib/utils"
import type { InputHTMLAttributes } from "react"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        // Base styles
        "flex h-11 w-full rounded-xl px-4 py-2 text-sm font-medium",
        // Colors
        "bg-input border border-border/50 text-foreground",
        // Placeholder
        "placeholder:text-muted-foreground/70",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
        "transition-all duration-200",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        // Base styles
        "flex min-h-[120px] w-full rounded-xl px-4 py-3 text-sm font-medium",
        // Colors
        "bg-input border border-border/50 text-foreground",
        // Placeholder
        "placeholder:text-muted-foreground/70",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
        "transition-all duration-200",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Resize
        "resize-none",
        className
      )}
      {...props}
    />
  )
}
