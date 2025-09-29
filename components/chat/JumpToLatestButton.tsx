"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface JumpToLatestButtonProps {
  onJumpToLatest: () => void
  lastNewMessageAt: number
  className?: string
}

export function JumpToLatestButton({ onJumpToLatest, lastNewMessageAt, className }: JumpToLatestButtonProps) {
  const [shouldPulse, setShouldPulse] = useState(false)

  useEffect(() => {
    if (lastNewMessageAt > 0) {
      setShouldPulse(true)
      const timer = setTimeout(() => setShouldPulse(false), 800)
      return () => clearTimeout(timer)
    }
  }, [lastNewMessageAt])

  return (
    <Button
      onClick={onJumpToLatest}
      size="sm"
      className={`
        fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full p-0 shadow-lg
        bg-primary hover:bg-primary/90 text-primary-foreground
        transition-all duration-200 ease-out
        ${shouldPulse ? "animate-pulse scale-110" : "scale-100"}
        ${className}
      `}
      aria-label="Jump to latest message"
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  )
}
