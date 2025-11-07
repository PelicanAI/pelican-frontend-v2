"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PelicanThinkingIndicatorProps {
  className?: string
}

const FRAMES = ["", ".", "..", "..."]

export function PelicanThinkingIndicator({ className }: PelicanThinkingIndicatorProps) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAMES.length)
    }, 450)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={cn("text-xs text-muted-foreground", className)}>
      Pelican is thinking{FRAMES[frameIndex]}
    </div>
  )
}

