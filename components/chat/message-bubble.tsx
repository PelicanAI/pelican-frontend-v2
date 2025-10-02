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
import { getMessageAnimationVariant } from "@/lib/animation-config"

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
        {/* User message with bubble - right-aligned */}
        <div className="max-w-3xl mx-auto px-8">
          <div className="flex gap-6 items-start justify-end">
            {/* Message bubble */}
            <div className="max-w-[700px]">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl px-4 py-3 shadow-md">
                {renderAttachments(message.attachments)}
                <div className="text-base leading-relaxed break-words">
                  {message.content}
                </div>
              </div>
              
              {/* Action buttons - always visible */}
              <div className="flex items-center gap-2 mt-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickCopy}
                  className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  title="Copy message"
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            
            {/* User avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="You" />
                <AvatarFallback className="bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium">
                  You
                </AvatarFallback>
              </Avatar>
            </div>
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
            <Avatar className="h-8 w-8">
              <AvatarImage src="/ai-avatar.jpg" alt="Pelican AI" className="object-cover" />
              <AvatarFallback className="bg-teal-600 text-white text-sm font-medium">P</AvatarFallback>
            </Avatar>
          </div>
          
          {/* Message content - plain text, no bubble */}
          <div className="flex-1 min-w-0 max-w-[700px]">
            {renderAttachments(message.attachments)}
            <div className="text-base leading-relaxed text-gray-900 dark:text-gray-100">
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
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
                "bg-gray-100 border-gray-200",
                "dark:bg-slate-900 dark:border-slate-700",
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
