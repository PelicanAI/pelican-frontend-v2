"use client"

import { motion } from "framer-motion"
import { formatLine } from "./format-utils"

interface TextSegmentProps {
  content: string
  index: number
  isStreaming: boolean
  isLargeContent: boolean
}

export function TextSegment({ content, index, isStreaming, isLargeContent }: TextSegmentProps) {
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

  const safeLines = content
    .split("\n")
    .map((line) => formatLine(line))
    .join("<br />")

  return (
    <motion.div
      key={`text-${index}`}
      className="space-y-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      dangerouslySetInnerHTML={{ __html: safeLines }}
    />
  )
}
