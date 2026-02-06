"use client"

import { motion } from "framer-motion"

interface DraftIndicatorProps {
  pendingDraft: string
}

export function DraftIndicator({ pendingDraft }: DraftIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-sm text-amber-700 dark:text-amber-300">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        Queued: &quot;{pendingDraft.slice(0, 30)}
        {pendingDraft.length > 30 ? "..." : ""}&quot;
      </div>
    </motion.div>
  )
}
