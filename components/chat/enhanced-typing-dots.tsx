"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ANIMATION_CONFIG, messageVariants } from "@/lib/animation-config"

// ─── Category definitions ─────────────────────────────────────
type Category = "backtest" | "technical" | "tick" | "scan" | "macro" | "default"

interface TimedMessage {
  /** Seconds threshold — message shows when elapsed >= this value */
  after: number
  text: string
}

const THINKING_MESSAGES: Record<Category, TimedMessage[]> = {
  backtest: [
    { after: 0, text: "Loading historical data" },
    { after: 2, text: "Running backtest simulation" },
    { after: 5, text: "Calculating returns & drawdowns" },
    { after: 8, text: "Compiling performance report" },
  ],
  technical: [
    { after: 0, text: "Pulling price data" },
    { after: 2, text: "Running technical indicators" },
    { after: 5, text: "Analyzing chart patterns" },
    { after: 8, text: "Forming technical outlook" },
  ],
  tick: [
    { after: 0, text: "Fetching latest quotes" },
    { after: 2, text: "Checking price action" },
    { after: 5, text: "Comparing to recent range" },
    { after: 8, text: "Summarizing price data" },
  ],
  scan: [
    { after: 0, text: "Scanning the market" },
    { after: 2, text: "Filtering by criteria" },
    { after: 5, text: "Ranking top matches" },
    { after: 8, text: "Preparing results" },
  ],
  macro: [
    { after: 0, text: "Checking macro landscape" },
    { after: 2, text: "Reading recent headlines" },
    { after: 5, text: "Analyzing economic data" },
    { after: 8, text: "Synthesizing macro view" },
  ],
  default: [
    { after: 0, text: "Pelican is thinking" },
    { after: 2, text: "Analyzing your question" },
    { after: 5, text: "Researching the answer" },
    { after: 8, text: "Almost there" },
  ],
}

// ─── Keyword → category mapping (priority: backtest > technical > tick > scan > macro > default) ──
const CATEGORY_KEYWORDS: { category: Category; patterns: RegExp }[] = [
  {
    category: "backtest",
    patterns: /backtest|back\s*test|historical\s*performance|simulate|strategy\s*test/i,
  },
  {
    category: "technical",
    patterns: /technical|support|resistance|rsi|macd|moving\s*average|sma|ema|bollinger|fibonacci|chart|pattern|candlestick|indicator|oversold|overbought/i,
  },
  {
    category: "tick",
    patterns: /price\s*of|how\s*much\s*is|quote|what('s|\s*is)\s*\w{1,5}\s*(at|trading|worth|price)|current\s*price|stock\s*price|ticker/i,
  },
  {
    category: "scan",
    patterns: /top\s*gain|top\s*los|most\s*volatile|scan|screen|filter|best\s*stock|worst\s*stock|biggest\s*mov|trending\s*stock/i,
  },
  {
    category: "macro",
    patterns: /market\s*(down|up|crash|rally)|economy|fed|fomc|cpi|inflation|gdp|jobs\s*report|nfp|interest\s*rate|recession|macro|news|headline|earnings\s*season/i,
  },
]

/** Detect the best category for a user message. */
export function getThinkingCategory(userMessage: string): Category {
  if (!userMessage) return "default"
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.test(userMessage)) return category
  }
  return "default"
}

/** Get the current thinking message for a category + elapsed seconds. */
function getCurrentMessage(category: Category, elapsedSeconds: number): string {
  const messages = THINKING_MESSAGES[category] ?? THINKING_MESSAGES.default
  let current = messages[0]!.text
  for (const msg of messages) {
    if (elapsedSeconds >= msg.after) current = msg.text
  }
  return current
}

// ─── Component ────────────────────────────────────────────────
interface EnhancedTypingDotsProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "thinking" | "processing"
  /** The user's last message — used for context-aware thinking text */
  userMessage?: string
  /** Elapsed seconds from the response timer */
  elapsedSeconds?: number
}

export function EnhancedTypingDots({
  className,
  size = "md",
  variant = "default",
  userMessage = "",
  elapsedSeconds = 0,
}: EnhancedTypingDotsProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  }

  // Determine category once when userMessage changes
  const categoryRef = useRef<Category>("default")
  const prevMessageRef = useRef(userMessage)
  if (userMessage !== prevMessageRef.current) {
    categoryRef.current = getThinkingCategory(userMessage)
    prevMessageRef.current = userMessage
  }

  const [displayText, setDisplayText] = useState(() =>
    getCurrentMessage(categoryRef.current, elapsedSeconds)
  )

  // Update displayed text as elapsed seconds change
  useEffect(() => {
    const next = getCurrentMessage(categoryRef.current, elapsedSeconds)
    setDisplayText(next)
  }, [elapsedSeconds])

  // Fallback for non-context-aware usage
  const fallbackMessages: Record<string, string> = {
    default: "Pelican is typing",
    thinking: "Pelican is thinking",
    processing: "Processing your request",
  }

  const showContextAware = variant === "thinking" && userMessage
  const text = showContextAware ? displayText : fallbackMessages[variant]

  return (
    <motion.div
      initial={messageVariants.thinkingIndicator.initial}
      animate={messageVariants.thinkingIndicator.animate}
      exit={messageVariants.thinkingIndicator.exit}
      transition={messageVariants.thinkingIndicator.transition}
      className={cn("flex items-center gap-3", className)}
      aria-label={text}
      role="status"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn("bg-current rounded-full", sizeClasses[size])}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </div>

      <motion.div
        className="px-3 py-1 rounded-full bg-current/5"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: ANIMATION_CONFIG.typingIndicator.duration,
          repeat: Infinity,
          ease: ANIMATION_CONFIG.typingIndicator.ease,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={text}
            className="text-sm text-muted-foreground font-medium block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {text}...
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
