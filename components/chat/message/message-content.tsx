"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { EnhancedTypingDots } from "../enhanced-typing-dots"
import { detectDataTable } from "@/lib/data-parsers"
import { DataTable } from "@/components/chat/data-visualizations/data-table"
import { parseContentSegments } from "./format-utils"
import { CodeBlock } from "./code-block"
import { TextSegment } from "./text-segment"

interface MessageContentProps {
  content: string
  isStreaming: boolean
  showSkeleton?: boolean
}

export function MessageContent({
  content,
  isStreaming,
  showSkeleton,
}: MessageContentProps) {
  const [showRawText, setShowRawText] = useState(false)

  // Defensive check - ensure content is always a string
  const safeContent = typeof content === 'string' ? content : String(content || '')

  // Only parse data table when NOT streaming (expensive operation)
  const parsedData = useMemo(
    () => (!isStreaming ? detectDataTable(safeContent) : null),
    [safeContent, isStreaming]
  )

  // Performance: skip expensive parsing during streaming for large content
  const segments = useMemo(() => {
    if (isStreaming && safeContent.length > 1000) {
      return [{ type: "text" as const, content: safeContent }]
    }
    return parseContentSegments(safeContent)
  }, [safeContent, isStreaming])

  if (showSkeleton && !safeContent) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 bg-current/20 rounded animate-pulse w-24" />
      </div>
    )
  }

  if (!safeContent && isStreaming) {
    return <EnhancedTypingDots variant="thinking" />
  }

  if (!safeContent) {
    return <div className="text-muted-foreground italic">No content</div>
  }

  if (parsedData && !showRawText) {
    const isStructured = "columns" in parsedData

    return (
      <DataTable
        data={parsedData.data}
        title={parsedData.title}
        {...(isStructured && 'columns' in parsedData
          ? {
              columns: parsedData.columns,
              query: parsedData.query,
              summary: parsedData.summary,
            }
          : {})}
        onToggle={() => setShowRawText(true)}
      />
    )
  }

  const isLargeContent = safeContent.length > 2000

  return (
    <motion.div
      className="leading-relaxed tracking-normal font-normal break-words overflow-wrap-anywhere hyphens-auto max-w-full text-rendering-optimizeLegibility"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        {segments.map((segment, index) => {
          if (segment.type === "code") {
            return (
              <CodeBlock
                key={`code-${index}`}
                content={segment.content}
                language={segment.language}
                index={index}
              />
            )
          }

          return (
            <TextSegment
              key={`text-${index}`}
              content={segment.content}
              index={index}
              isStreaming={isStreaming}
              isLargeContent={isLargeContent}
            />
          )
        })}
      </div>
    </motion.div>
  )
}
