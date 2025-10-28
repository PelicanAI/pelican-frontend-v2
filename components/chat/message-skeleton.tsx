"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MessageSkeletonProps {
  isUser?: boolean
  className?: string
}

export function MessageSkeleton({ isUser = false, className }: MessageSkeletonProps) {
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("flex justify-end w-full mb-6", className)}
      >
        <div className="flex flex-col items-end max-w-[70%] md:max-w-[70%] w-full md:w-auto">
          <div className="bg-primary rounded-xl px-4 py-3 shadow-sm">
            <div className="space-y-2">
              <div className="h-4 bg-primary-foreground/20 rounded animate-pulse w-32" />
              <div className="h-4 bg-primary-foreground/20 rounded animate-pulse w-24" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex gap-3 w-full mb-6", className)}
    >
      {/* Avatar skeleton */}
      <div className="flex-shrink-0">
        <div className="h-8 w-8 bg-primary/20 rounded-full animate-pulse" />
      </div>

      {/* Message content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-48" />
            <div className="h-4 bg-muted rounded animate-pulse w-36" />
            <div className="h-4 bg-muted rounded animate-pulse w-28" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
