"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { Message } from "@/lib/chat-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTimestamp } from "@/components/ui/relative-timestamp"
import { AttachmentChip } from "./attachment-chip"
import { MessageActions } from "./message-actions"
import { EnhancedTypingDots } from "./enhanced-typing-dots"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback, useMemo } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getMessageAnimationVariant } from "@/lib/animation-config"
import { detectDataTable } from '@/lib/data-parsers'
import { DataTable } from '@/components/chat/data-visualizations/data-table'
import DOMPurify from "isomorphic-dompurify"
import { escapeHtml } from "@/lib/sanitize"

type ContentSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language?: string }

const LINK_REGEX = /(https?:\/\/[^\s]+)/g

function parseContentSegments(rawContent: string): ContentSegment[] {
  const lines = rawContent.split("\n")
  const segments: ContentSegment[] = []

  let isInCodeBlock = false
  let currentLanguage: string | undefined
  let codeBuffer: string[] = []
  let textBuffer: string[] = []

  const flushText = () => {
    if (textBuffer.length > 0) {
      const text = textBuffer.join("\n").trimEnd()
      if (text.length > 0) {
        segments.push({ type: "text", content: text })
      }
      textBuffer = []
    }
  }

  const flushCode = () => {
    const code = codeBuffer.join("\n")
    segments.push({ type: "code", content: code, language: currentLanguage })
    codeBuffer = []
    currentLanguage = undefined
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^```(.*)?$/)

    if (fenceMatch) {
      if (isInCodeBlock) {
        flushCode()
        isInCodeBlock = false
      } else {
        flushText()
        isInCodeBlock = true
        const language = fenceMatch[1]?.trim()
        currentLanguage = language ? language : undefined
      }
      continue
    }

    if (isInCodeBlock) {
      codeBuffer.push(line)
    } else {
      textBuffer.push(line)
    }
  }

  if (isInCodeBlock) {
    flushCode()
  }

  if (textBuffer.length > 0) {
    const text = textBuffer.join("\n").trimEnd()
    if (text.length > 0) {
      segments.push({ type: "text", content: text })
    }
  }

  return segments
}

function formatLine(line: string): string {
  const escaped = escapeHtml(line)
  const boldFormatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-[600]">$1</strong>')
  const italicFormatted = boldFormatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  const linkFormatted = italicFormatted.replace(
    LINK_REGEX,
    (match) =>
      `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-teal-600 font-[500] break-all">${match}</a>`
  )

  return DOMPurify.sanitize(linkFormatted, {
    ALLOWED_TAGS: ["strong", "em", "a", "span", "br"],
    ALLOWED_ATTR: {
      a: ["href", "target", "rel", "class"],
      span: ["class"],
    },
  })
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  showSkeleton?: boolean
  isDarkMode?: boolean
  onRegenerate?: () => void
  onStop?: () => void
  onReaction?: (messageId: string, reaction: "like" | "dislike") => void
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
}

export function MessageBubble({
  message,
  isStreaming = false,
  showSkeleton = false,
  isDarkMode = false,
  onRegenerate,
  onStop,
  onReaction,
  onEdit,
  onDelete,
  onPin,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const triggerHapticFeedback = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }, [])

  const handleQuickCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      triggerHapticFeedback()

      try {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)

        toast({
          title: "Copied!",
          description: "Message copied to clipboard",
          duration: 2000,
        })
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy message",
          variant: "destructive",
        })
      }
    },
    [message.content, triggerHapticFeedback, toast],
  )

  const renderAttachments = (attachments: typeof message.attachments) => {
    if (!attachments || attachments.length === 0) return null

    return (
      <motion.div
        className="flex flex-wrap gap-2 mb-3"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {attachments.map((attachment, index) => {
          const isImage =
            attachment.type.toLowerCase().includes("image") ||
            attachment.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i)

          if (isImage) {
            return (
              <motion.div
                key={index}
                className="relative group"
              >
                <img
                  src={attachment.url || "/placeholder.svg"}
                  alt={attachment.name}
                  className="max-w-[200px] rounded-lg shadow-sm cursor-pointer"
                  onClick={() => window.open(attachment.url, "_blank")}
                />
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0">
                  {attachment.name}
                </div>
              </motion.div>
            )
          }

          return (
            <AttachmentChip
              key={index}
              name={attachment.name}
              type={attachment.type}
              onClick={() => window.open(attachment.url, "_blank")}
            />
          )
        })}
      </motion.div>
    )
  }

  // Get animation variant based on message role
  const animationVariant = getMessageAnimationVariant(message.role)

  if (isUser) {
    return (
      <motion.div
        {...animationVariant}
        className="w-full py-4"
        role="article"
        aria-label="Your message"
        data-message-id={message.id}
        data-message-role="user"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* User message - clean, no bubble, right-aligned */}
        <div className="max-w-3xl mx-auto px-8">
          <div className="flex gap-6 items-start justify-end">
            {/* Message content */}
            <div className="max-w-[700px]">
              <div className="text-base leading-relaxed break-words text-foreground">
                {renderAttachments(message.attachments)}
                {message.content}
              </div>

              {/* Action buttons - always visible */}
              <div className="flex items-center gap-2 mt-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickCopy}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Copy message"
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* User avatar - hidden per requirements */}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      {...animationVariant}
      className="w-full py-4"
      role="article"
      aria-label="Assistant message"
      data-message-id={message.id}
      data-message-role="assistant"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* AI message - clean, no bubble, no background */}
      <div className="max-w-3xl mx-auto px-8">
        <div className="flex gap-6 items-start">
          {/* AI avatar */}
          <div className="flex-shrink-0">
            <img
              src="/pelican-logo.png"
              alt="Pelican AI"
              className="w-8 h-8 object-contain"
            />
          </div>

          {/* Message content - plain text, no bubble */}
          <div className="flex-1 min-w-0 max-w-[700px]">
            {renderAttachments(message.attachments)}
            <div className="text-base leading-relaxed text-foreground">
              <MessageContent
                content={message.content}
                isStreaming={isStreaming}
                showSkeleton={showSkeleton}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Action buttons - always visible */}
            <div className="flex items-center gap-2 mt-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickCopy}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Copy message"
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              
              {onRegenerate && (
                <MessageActions
                  message={message}
                  onStop={onStop}
                  onRegenerate={onRegenerate}
                  onReaction={onReaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPin={onPin}
                  isRegenerating={false}
                  canDelete={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MessageContent({
  content,
  isStreaming,
  showSkeleton,
  isDarkMode,
}: {
  content: string
  isStreaming: boolean
  showSkeleton?: boolean
  isDarkMode?: boolean
}) {
  const [showRawText, setShowRawText] = useState(false)
  const parsedData = useMemo(() => (!isStreaming ? detectDataTable(content) : null), [content, isStreaming])
  const segments = useMemo(() => parseContentSegments(content), [content])

  if (showSkeleton && !content) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 bg-current/20 rounded animate-pulse w-24" />
      </div>
    )
  }

  if (!content && isStreaming) {
    return <EnhancedTypingDots variant="thinking" />
  }

  if (!content) {
    return <div className="text-muted-foreground italic">No content</div>
  }

  if (parsedData && !showRawText) {
    const isStructured = "columns" in parsedData

    return (
      <DataTable
        data={parsedData.data as any}
        title={parsedData.title}
        {...(isStructured
          ? {
              columns: (parsedData as any).columns,
              query: (parsedData as any).query,
              summary: (parsedData as any).summary,
            }
          : {})}
        onToggle={() => setShowRawText(true)}
      />
    )
  }

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
    const sanitizedCode = DOMPurify.sanitize(segment.content)
            return (
              <motion.div
                key={`code-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={cn(
                  "relative group my-3 rounded-lg border overflow-hidden font-mono",
                  "bg-muted/30 border-border",
                )}
              >
                <div className="relative">
                  <div className="p-3 text-sm overflow-x-auto whitespace-pre max-w-full leading-[1.5]">
                    <code>{sanitizedCode}</code>
                  </div>
                  {segment.language && (
                    <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide text-gray-400">
                      {segment.language}
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-200"
                    onClick={() => navigator.clipboard.writeText(segment.content)}
                    aria-label="Copy code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          }

          const safeLines = segment.content
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
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(safeLines) }}
            />
          )
        })}
      </div>

      {isStreaming && (
        <motion.span
          className="inline-block w-[2px] h-[1.2em] ml-0.5 bg-current opacity-70"
          animate={{ opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  )
}
