"use client"

import { useState, useEffect, useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface RelativeTimestampProps {
  date: Date | string
  className?: string
  updateInterval?: number // milliseconds
  showTooltip?: boolean
}

export function RelativeTimestamp({
  date,
  className,
  updateInterval = 60000, // 1 minute default
  showTooltip = true,
}: RelativeTimestampProps) {
  const [now, setNow] = useState(new Date())

  const timestamp = useMemo(() => {
    return typeof date === "string" ? new Date(date) : date
  }, [date])

  // Update current time for relative calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, updateInterval)

    return () => clearInterval(interval)
  }, [updateInterval])

  const formatRelativeTime = useMemo(() => {
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // < 1 minute: "just now"
    if (diffMinutes < 1) {
      return "just now"
    }

    // < 60 minutes: "X minutes ago"
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
    }

    // < 24 hours: "X hours ago"
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
    }

    // < 7 days: "Monday at 3:45 PM"
    if (diffDays < 7) {
      return timestamp
        .toLocaleDateString("en-US", {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at")
    }

    // < 30 days: "Oct 15 at 3:45 PM"
    if (diffDays < 30) {
      return timestamp
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at")
    }

    // Older: "Oct 15, 2024"
    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [timestamp, now])

  const fullTimestamp = useMemo(() => {
    return timestamp.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }, [timestamp])

  const timestampElement = <span className={cn("text-xs", className)}>{formatRelativeTime}</span>

  if (!showTooltip) {
    return timestampElement
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{timestampElement}</TooltipTrigger>
        <TooltipContent>
          <p>{fullTimestamp}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
