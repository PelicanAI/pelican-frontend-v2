"use client"

import { useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { formatLine, applyTickerLinks } from "./format-utils"
import { useChart } from "@/providers/chart-provider"

interface TextSegmentProps {
  content: string
  index: number
  isStreaming: boolean
  isLargeContent: boolean
  tickers?: string[]
  economicTerms?: string[]
}

export function TextSegment({ content, index, isStreaming, isLargeContent, tickers, economicTerms }: TextSegmentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showChart, showCalendar } = useChart()

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains("ticker-link")) return

      e.preventDefault()
      const econTerm = target.getAttribute("data-economic-term")
      if (econTerm) {
        showCalendar()
        return
      }
      const ticker = target.getAttribute("data-ticker")
      if (ticker) {
        showChart(ticker)
      }
    },
    [showChart, showCalendar]
  )

  const hasLinks = (tickers && tickers.length > 0) || (economicTerms && economicTerms.length > 0)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !hasLinks) return
    el.addEventListener("click", handleClick)
    return () => el.removeEventListener("click", handleClick)
  }, [handleClick, hasLinks])

  // Performance: skip expensive formatting during streaming for large content
  if (isStreaming && isLargeContent) {
    return (
      <motion.div
        key={`text-${index}`}
        className="space-y-2 whitespace-pre-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {content}
      </motion.div>
    )
  }

  let safeLines = content
    .split("\n")
    .map((line) => formatLine(line))
    .join("<br />")

  // Apply ticker + economic term highlighting for non-streaming assistant messages
  if (hasLinks && !isStreaming) {
    safeLines = applyTickerLinks(safeLines, tickers ?? [], economicTerms)
  }

  return (
    <motion.div
      ref={containerRef}
      key={`text-${index}`}
      className="space-y-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      dangerouslySetInnerHTML={{ __html: safeLines }}
    />
  )
}
