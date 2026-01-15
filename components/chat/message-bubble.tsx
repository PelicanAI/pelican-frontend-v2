"use client"

import type React from "react"

import { cn, safeTrim } from "@/lib/utils"
import type { Message } from "@/lib/chat-utils"
import { AttachmentChip } from "./attachment-chip"
import { MessageActions } from "./message-actions"
import { EnhancedTypingDots } from "./enhanced-typing-dots"
import { TableImageDisplay } from "./table-image-display"
import { motion } from "framer-motion"
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

function parseContentSegments(content: string): ContentSegment[] {
  // No defensive check needed - type system guarantees string
  const lines = content.split("\n")
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
        const language = fenceMatch[1] ? safeTrim(fenceMatch[1]) : undefined
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
  // Step 1: Escape HTML first
  let escaped = escapeHtml(line)
  
  // Step 2: Apply markdown formatting on escaped content
  // Handle bold text with colored section headers
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    // Section headers end with colon - apply purple accent color
    if (content.endsWith(':')) {
      return `<strong class="font-semibold text-purple-400">${content}</strong>`
    }
    return `<strong class="font-[600]">${content}</strong>`
  })
  
  // Also handle non-bold section headers (word followed by colon at start of line)
  // This catches "Support:" without asterisks
  if (/^[A-Z][a-zA-Z\s]+:/.test(escaped) && !escaped.includes('<strong')) {
    escaped = escaped.replace(/^([A-Z][a-zA-Z\s]+:)/, '<strong class="font-semibold text-purple-400">$1</strong>')
  }
  
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Step 3: Safe link handling with URL validation
  escaped = escaped.replace(LINK_REGEX, (match) => {
    try {
      const url = new URL(match)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return match // Don't linkify invalid protocols
      }
      // Sanitize URL to prevent attribute injection
      const sanitizedUrl = DOMPurify.sanitize(match, {ALLOWED_TAGS: []})
      return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-600 font-[500] break-all">${match}</a>`
    } catch {
      return match // Invalid URL, don't linkify
    }
  })
  
  // Step 4: Final sanitization with strict URI regexp
  return DOMPurify.sanitize(escaped, {
    ALLOWED_TAGS: ["strong", "em", "a", "span", "br"],
    ALLOWED_ATTR: { 
      a: ["href", "target", "rel", "class"],
      span: ["class"],
      strong: ["class"],
      em: ["class"],
    } as unknown as string[],
    ALLOWED_URI_REGEXP: /^https?:\/\//i // Only allow http/https
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
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const isUser = message.role === "user"

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
        // Defensive check - ensure content is a string
        const contentToCopy = typeof message.content === 'string' ? message.content : String(message.content || '')
        await navigator.clipboard.writeText(contentToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)

        toast({
          title: "Copied!",
          description: "Message copied to clipboard",
          duration: 2000,
        })
      } catch {
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
      <div className="attachments-container my-4">
        {attachments.map((attachment, index) => {
          const isImage =
            attachment.type?.toLowerCase().includes("image") ||
            attachment.type === "image/png" ||
            attachment.type === "image/jpeg" ||
            attachment.type === "image/jpg" ||
            attachment.type === "image/gif" ||
            attachment.type === "image/webp" ||
            attachment.name?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i)

          // Check if this is a Pelican-generated table image
          // Backend sends table images with type: "image/png" 
          const isPelicanTable = 
            isImage && 
            (attachment.type === "image/png" ||
             attachment.name?.toLowerCase().includes("pelican_analysis") || 
             attachment.name?.toLowerCase().includes("pelican_table") ||
             attachment.name?.toLowerCase().includes("table"))

          if (isPelicanTable) {
            // Use the enhanced TableImageDisplay component for Pelican tables
            return <TableImageDisplay key={index} attachment={attachment} />
          } else if (isImage) {
            // Regular image - display with proper styling
            return (
              <motion.div
                key={index}
                className="my-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="relative group bg-background rounded-lg border border-border shadow-sm overflow-hidden max-w-full">
                  <img
                    src={attachment.url || "/placeholder.svg"}
                    alt={attachment.name || "Attachment"}
                    className="w-full h-auto max-w-full cursor-pointer"
                    style={{ maxHeight: "600px", objectFit: "contain" }}
                    onClick={() => window.open(attachment.url, "_blank")}
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                    loading="lazy"
                  />
                  {attachment.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {attachment.name}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          }

          // Non-image attachments
          return (
            <motion.div
              key={index}
              className="flex flex-wrap gap-2 mb-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <AttachmentChip
                name={attachment.name || "Attachment"}
                type={attachment.type || "application/octet-stream"}
                onClick={() => window.open(attachment.url, "_blank")}
              />
            </motion.div>
          )
        })}
      </div>
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
      >
        {/* User message - clean, no bubble, right-aligned */}
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="flex gap-4 sm:gap-6 items-start justify-end">
            {/* Message content */}
            <div className="max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[600px]">
              <div className="text-[15px] sm:text-base leading-relaxed break-words text-foreground">
                {renderAttachments(message.attachments)}
                {message.content}
              </div>

              {/* Action buttons - always visible */}
              <div className="flex items-center gap-2 mt-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickCopy}
                  className="h-11 sm:h-7 px-3 sm:px-2 min-h-[44px] sm:min-h-0 text-xs text-muted-foreground hover:text-foreground"
                  title="Copy message"
                >
                  {copied ? <Check className="h-4 w-4 sm:h-3 sm:w-3 mr-1" /> : <Copy className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />}
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
    >
      {/* AI message - Plain text style */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className="flex gap-3 sm:gap-6 items-start">
          {/* AI avatar */}
          <div className="flex-shrink-0">
            <img
              src="/pelican-logo.png"
              alt="Pelican AI"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
          </div>

          {/* Message content - plain text, no bubble */}
          <div className="flex-1 min-w-0 max-w-[90%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[700px]">
            {renderAttachments(message.attachments)}
            <div className="text-[16px] sm:text-base leading-relaxed text-foreground">
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
                className="h-11 sm:h-7 px-3 sm:px-2 min-h-[44px] sm:min-h-0 text-xs text-muted-foreground hover:text-foreground"
                title="Copy message"
              >
                {copied ? <Check className="h-4 w-4 sm:h-3 sm:w-3 mr-1" /> : <Copy className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />}
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
}: {
  content: string
  isStreaming: boolean
  showSkeleton?: boolean
}) {
  const [showRawText, setShowRawText] = useState(false)
  
  // Defensive check - ensure content is always a string
  const safeContent = typeof content === 'string' ? content : String(content || '')
  
  // Only parse data table when NOT streaming (expensive operation)
  const parsedData = useMemo(
    () => (!isStreaming ? detectDataTable(safeContent) : null), 
    [safeContent, isStreaming]
  )
  
  // ⚡ PERFORMANCE FIX: Skip expensive parsing during streaming for large content
  // Parsing 10KB of text 200 times (once per chunk) kills performance
  const segments = useMemo(() => {
    // During streaming with large content, skip segment parsing entirely
    // Just treat the whole thing as one text segment
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
                  "max-w-full overflow-x-auto"
                )}
              >
                <div className="relative">
                  <div className="p-3 text-[13px] sm:text-sm overflow-x-auto whitespace-pre max-w-full leading-[1.5]">
                    <code>{sanitizedCode}</code>
                  </div>
                  
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                  
                  {segment.language && (
                    <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {segment.language}
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                    onClick={() => navigator.clipboard.writeText(segment.content)}
                    aria-label="Copy code"
                  >
                    <Copy className="h-5 w-5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </motion.div>
            )
          }

          // ⚡ PERFORMANCE FIX: Skip expensive formatting during streaming for large content
          // formatLine runs regex on every line - very expensive when done 200 times
          if (isStreaming && safeContent.length > 2000) {
            return (
              <motion.div
                key={`text-${index}`}
                className="space-y-2 whitespace-pre-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {segment.content}
              </motion.div>
            )
          }

          // Normal path: format content (only when not streaming or content is small)
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
              dangerouslySetInnerHTML={{ __html: safeLines }}
            />
          )
        })}
      </div>
    </motion.div>
  )
}
