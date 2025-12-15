import * as React from "react"
import { cn } from "@/lib/utils"

// Chart container component for consistent styling
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, { label: string; color: string }>
  }
>(({ className, config, children, ...props }, ref) => {
  // Create CSS variables for chart colors
  const style = config
    ? Object.entries(config).reduce((acc, [key, value]) => {
        acc[`--color-${key}`] = value.color
        return acc
      }, {} as Record<string, string>)
    : {}

  return (
    <div
      ref={ref}
      className={cn("flex aspect-video justify-center text-xs", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Chart tooltip content component
interface ChartTooltipContentProps {
  active?: boolean
  payload?: ReadonlyArray<{
    name?: string
    value?: number
    payload?: Record<string, unknown>
    color?: string
    dataKey?: string | number
  }> | null
  label?: string | number
  labelFormatter?: (label: string) => string
  valueFormatter?: (value: number) => string
  hideLabel?: boolean
  indicator?: "line" | "dot" | "dashed"
  config?: Record<string, { label: string; color: string }>
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      labelFormatter,
      valueFormatter,
      hideLabel = false,
      indicator = "dot",
      config,
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className="rounded-lg border bg-background p-2 shadow-sm"
      >
        {!hideLabel && (
          <div className="mb-1 font-medium text-sm">
            {labelFormatter ? labelFormatter(String(label || "")) : label}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {payload.map((item, index) => {
            const key = item.dataKey || item.name
            const itemConfig = config?.[key as string]
            const color = item.color || itemConfig?.color || "hsl(var(--primary))"
            const displayLabel = itemConfig?.label || item.name

            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                {indicator === "dot" && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "line" && (
                  <div
                    className="h-0.5 w-3"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "dashed" && (
                  <div
                    className="h-0.5 w-3 border-t-2 border-dashed"
                    style={{ borderColor: color }}
                  />
                )}
                <span className="text-muted-foreground">{displayLabel}:</span>
                <span className="font-medium">
                  {valueFormatter && item.value !== undefined ? valueFormatter(item.value) : item.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltipContent }
