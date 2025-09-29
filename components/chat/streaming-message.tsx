"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MessageBubble } from "./message-bubble"
import type { Message } from "@/lib/chat-utils"
import { LIMITS } from "@/lib/constants"

interface StreamingMessageProps {
  message: Message
  onStop?: () => void
  onRegenerate?: () => void
  onReaction?: (messageId: string, reaction: "like" | "dislike") => void
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  showActions?: boolean
  isDarkMode?: boolean
}

export function StreamingMessage({
  message,
  onStop,
  onRegenerate,
  onReaction,
  onEdit,
  onDelete,
  onPin,
  showActions = true,
  isDarkMode = false,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(message.role === "user" ? message.content : "")
  const [isTyping, setIsTyping] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  useEffect(() => {
    if (message.role === "user") {
      setDisplayedContent(message.content)
      setIsTyping(false)
      setShowTypingIndicator(false)
      return
    }

    if (message.isStreaming && message.content !== displayedContent) {
      if (!displayedContent && message.content) {
        setShowTypingIndicator(true)
        const indicatorTimeout = setTimeout(() => {
          setShowTypingIndicator(false)
          setIsTyping(true)
        }, 500)

        return () => clearTimeout(indicatorTimeout)
      }

      if (!showTypingIndicator) {
        setIsTyping(true)

        // Enhanced typing effect with variable speed
        const content = message.content
        let currentIndex = displayedContent.length

        const typeInterval = setInterval(
          () => {
            if (currentIndex < content.length) {
              setDisplayedContent(content.slice(0, currentIndex + 1))
              currentIndex++
            } else {
              setIsTyping(false)
              clearInterval(typeInterval)
            }
          },
          Math.random() * (LIMITS.TYPING_INTERVAL_MAX_MS - LIMITS.TYPING_INTERVAL_MIN_MS) + LIMITS.TYPING_INTERVAL_MIN_MS,
        )

        return () => clearInterval(typeInterval)
      }
    } else if (!message.isStreaming) {
      setDisplayedContent(message.content)
      setIsTyping(false)
      setShowTypingIndicator(false)
    }
  }, [message.content, message.isStreaming, displayedContent, message.role, showTypingIndicator])

  const displayMessage = {
    ...message,
    content: displayedContent,
  }

  return (
    <motion.div
      className="relative group w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <MessageBubble
        message={displayMessage}
        isStreaming={message.isStreaming || isTyping}
        showSkeleton={showTypingIndicator}
        isDarkMode={isDarkMode}
        onStop={message.isStreaming ? onStop : undefined}
        onRegenerate={!message.isStreaming && message.role === "assistant" ? onRegenerate : undefined}
        onReaction={onReaction}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={onPin}
      />
    </motion.div>
  )
}
