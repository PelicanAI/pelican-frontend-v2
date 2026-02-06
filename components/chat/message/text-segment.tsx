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
}

export function TextSegment({ content, index, isStreaming, isLargeContent, tickers }: TextSegmentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showChart } = useChart()

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains("ticker-link")) {
        const ticker = target.getAttribute("data-ticker")
        if (ticker) {
          e.preventDefault()
          showChart(ticker)
        }
      }
    },
    [showChart]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el || !tickers?.length) return
    el.addEventListener("click", handleClick)
    return () => el.removeEventListener("click", handleClick)
  }, [handleClick, tickers])

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

  // Apply ticker highlighting for non-streaming assistant messages
  if (tickers && tickers.length > 0 && !isStreaming) {
    safeLines = applyTickerLinks(safeLines, tickers)
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
