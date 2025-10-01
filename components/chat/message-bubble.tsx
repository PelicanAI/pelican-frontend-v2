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
import { useState, useCallback } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          scale: { duration: 0.2 },
        }}
        className="flex justify-end w-full mb-4"
        role="article"
        aria-label="Your message"
      >
        <div className="flex flex-col items-end max-w-[min(70%,600px)]">
          <motion.div className="relative group">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md inline-block text-[15px] leading-relaxed text-rendering-optimizeLegibility">
              {renderAttachments(message.attachments)}
              <div className="break-words overflow-wrap-anywhere hyphens-auto selection:bg-teal-200 selection:text-teal-900">
                {message.content}
              </div>
            </div>

            {/* Quick copy button */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute -left-10 top-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleQuickCopy}
                    className="h-7 w-7 p-0 bg-background/95 backdrop-blur-sm border shadow-sm"
                    aria-label="Copy message"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Copy className="h-3 w-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timestamp on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -top-6 right-0 text-xs text-muted-foreground"
                >
                  <RelativeTimestamp date={message.timestamp} updateInterval={60000} showTooltip={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Action buttons */}
          <div className="mt-1">
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
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
        scale: { duration: 0.2 },
      }}
      className="flex gap-2 w-full mb-4"
      role="article"
      aria-label="Assistant message"
    >
      <motion.div className="flex-shrink-0">
        <Avatar
          className={cn(
            "h-8 w-8 transition-all duration-200",
            isHovered ? "ring-2 ring-teal-500/40" : "ring-2 ring-transparent",
          )}
        >
          <AvatarImage src="/ai-avatar.jpg" alt="Pelican AI" className="object-cover" />
          <AvatarFallback className="bg-teal-600 text-white text-xs font-medium">P</AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex-1 min-w-0 max-w-full ml-2">
        <motion.div className="relative">
          <div
            className={cn(
              "rounded-2xl rounded-bl-md px-4 py-3 border overflow-hidden backdrop-blur-[8px] text-[15px] leading-relaxed text-rendering-optimizeLegibility shadow-sm",
              isDarkMode
                ? "bg-[rgba(30,30,30,0.7)] border-[rgba(255,255,255,0.1)] text-white selection:bg-teal-600/30"
                : "bg-white/90 border-gray-200/80 text-gray-900 selection:bg-teal-200/60",
            )}
          >
            {renderAttachments(message.attachments)}
            <MessageContent
              content={message.content}
              isStreaming={isStreaming}
              showSkeleton={showSkeleton}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Quick copy button */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute -right-10 top-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickCopy}
                  className="h-7 w-7 p-0 bg-background/95 backdrop-blur-sm border shadow-sm hover:bg-background"
                  aria-label="Copy message"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Copy className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timestamp on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-6 left-0 text-xs text-muted-foreground"
              >
                <RelativeTimestamp date={message.timestamp} updateInterval={60000} showTooltip={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action buttons */}
        <div className="mt-1">
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

  return (
    <motion.div
      className="leading-relaxed tracking-normal font-normal break-words overflow-wrap-anywhere hyphens-auto max-w-full text-rendering-optimizeLegibility"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="inline">
      {content.split("\n").map((line, index) => {
        if (line.includes("```")) {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "relative group my-2 rounded-lg border overflow-hidden font-mono",
                isDarkMode ? "bg-black/40 border-white/10" : "bg-gray-100 border-gray-200",
              )}
            >
              <div className="relative">
                <div className="p-3 text-sm overflow-x-auto whitespace-pre max-w-full leading-[1.4]">
                  <code>{line.replace(/```/g, "")}</code>
                </div>
                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-current/10 to-transparent pointer-events-none opacity-0" />
              </div>
              <motion.button
                className="absolute top-2 right-2 opacity-0 p-1.5 rounded"
                whileTap={{ scale: 0.95 }}
              >
                <Copy className="h-3 w-3" />
              </motion.button>
            </motion.div>
          )
        }

        if (line.includes("http")) {
          const parts = line.split(/(https?:\/\/[^\s]+)/g)
          return (
            <motion.div
              key={index}
              className="mb-1 break-words overflow-wrap-anywhere"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {parts.map((part, partIndex) =>
                part.match(/https?:\/\/[^\s]+/) ? (
                  <motion.a
                    key={partIndex}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 relative inline-block break-all font-[500]"
                  >
                    <span className="relative">
                      {part}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600"
                      />
                    </span>
                  </motion.a>
                ) : (
                  part
                ),
              )}
            </motion.div>
          )
        }

        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-[600]">$1</strong>')

        return (
          <motion.div
            key={index}
            className="mb-1 break-words overflow-wrap-anywhere"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        )
      })}
      </span>
      {/* Blinking cursor during text reveal */}
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
