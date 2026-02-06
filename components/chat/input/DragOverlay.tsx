"use client"

import { motion } from "framer-motion"

export function DragOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center backdrop-blur-sm"
    >
      <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">Drop file to attach</div>
    </motion.div>
  )
}
