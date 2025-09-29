"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewMessagesPillProps {
  show: boolean
  messageCount: number
  onJumpToBottom: () => void
}

export function NewMessagesPill({ show, messageCount, onJumpToBottom }: NewMessagesPillProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Button
            onClick={onJumpToBottom}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg border-0 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium"
          >
            <motion.div
              animate={{ y: [0, 2, 0] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            {messageCount} new message{messageCount !== 1 ? "s" : ""}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
