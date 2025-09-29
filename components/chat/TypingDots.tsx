"use client"

import { cn } from "@/lib/utils"

interface TypingDotsProps {
  className?: string
}

export function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Pelican is typing" role="status">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s] motion-reduce:animate-none" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s] motion-reduce:animate-none" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce motion-reduce:animate-none" />
    </div>
  )
}
