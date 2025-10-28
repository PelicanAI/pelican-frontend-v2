"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TrendingUp, Clock, Sparkles } from "lucide-react"

export interface Suggestion {
  text: string
  type: "ticker" | "query" | "recent"
  icon?: React.ReactNode
}

interface InputSuggestionsProps {
  suggestions: Suggestion[]
  selectedIndex: number
  onSelect: (suggestion: Suggestion) => void
  onHover: (index: number) => void
  position?: { top: number; left: number }
  visible: boolean
}

export function InputSuggestions({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  position,
  visible,
}: InputSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex])

  if (!visible || suggestions.length === 0) return null

  const getIcon = (suggestion: Suggestion) => {
    if (suggestion.icon) return suggestion.icon

    switch (suggestion.type) {
      case "ticker":
        return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
      case "recent":
        return <Clock className="h-3.5 w-3.5 text-blue-500" />
      case "query":
        return <Sparkles className="h-3.5 w-3.5 text-purple-500" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: Suggestion["type"]) => {
    switch (type) {
      case "ticker":
        return "Ticker"
      case "recent":
        return "Recent"
      case "query":
        return "Suggestion"
      default:
        return ""
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "absolute bottom-full mb-2 left-0 right-0 z-50",
          "bg-card backdrop-blur-xl",
          "border border-border rounded-lg shadow-2xl",
          "overflow-hidden max-h-64 overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        )}
        style={position}
      >
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, delay: index * 0.02 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-150",
                "hover:bg-primary/10",
                selectedIndex === index && "bg-primary/20 border-l-2 border-primary",
              )}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onHover(index)}
            >
              <div className="flex-shrink-0">{getIcon(suggestion)}</div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground font-medium truncate">{suggestion.text}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {getTypeLabel(suggestion.type)}
                </div>
              </div>

              {selectedIndex === index && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 text-[10px] text-primary font-medium px-2 py-0.5 bg-primary/20 rounded"
                >
                  ↵
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Hint footer */}
        <div className="border-t border-border px-3 py-1.5 bg-muted/50">
          <p className="text-[10px] text-muted-foreground flex items-center gap-2">
            <span className="text-primary">↑↓</span> Navigate
            <span className="mx-1">•</span>
            <span className="text-primary">↵/Tab</span> Select
            <span className="mx-1">•</span>
            <span className="text-primary">Esc</span> Close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}