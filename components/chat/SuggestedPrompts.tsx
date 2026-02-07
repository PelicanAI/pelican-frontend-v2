"use client"

import { motion } from "framer-motion"

const SUGGESTED_PROMPTS = [
  { icon: "\ud83d\udcca", text: "What are the top gaining stocks today?" },
  { icon: "\ud83d\udd0d", text: "Analyze AAPL's technical setup" },
  { icon: "\ud83d\udcc9", text: "Why is the market down today?" },
  { icon: "\ud83d\udca1", text: "Give me a swing trade for this week" },
  { icon: "\ud83c\udfe6", text: "Compare NVDA vs AMD for a long-term hold" },
  { icon: "\u26a1", text: "What are the most volatile stocks right now?" },
]

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pb-2">
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            onClick={() => onSelect(prompt.text)}
            className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all duration-200 text-left cursor-pointer group"
          >
            <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">{prompt.icon}</span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
              {prompt.text}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export { SUGGESTED_PROMPTS }
