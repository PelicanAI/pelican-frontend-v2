"use client"

import { motion } from "framer-motion"

interface ConversationHistorySkeletonProps {
  messageCount?: number
}

export function ConversationHistorySkeleton({ messageCount = 4 }: ConversationHistorySkeletonProps) {
  const messageLengths = ["w-48", "w-36", "w-52", "w-28"] // Varying lengths

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {Array.from({ length: messageCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <div className="flex gap-3 w-full mb-6">
            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <motion.div
                className="h-9 w-9 bg-primary/20 rounded-full"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Message content skeleton with shimmer */}
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 relative overflow-hidden">
                <div className="space-y-2">
                  <motion.div
                    className={`h-4 bg-muted rounded ${messageLengths[index % messageLengths.length]}`}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.2,
                    }}
                  />
                  <motion.div
                    className="h-4 bg-muted/60 rounded w-32"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.2 + 0.3,
                    }}
                  />
                </div>

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    delay: index * 0.5,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
