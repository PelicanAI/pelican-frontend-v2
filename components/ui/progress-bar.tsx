// FIX 43: Progress Bar Component

import { cn } from "@/lib/utils"

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
}: {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  )
}

