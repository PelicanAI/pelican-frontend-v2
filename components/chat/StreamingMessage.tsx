"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MessageBubble } from "./message-bubble"
import type { Message } from "@/lib/chat-utils"

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
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    if (message.role === "user") {
      setDisplayedContent(message.content)
      setIsTyping(false)
      setShowSkeleton(false)
      return
    }

    if (message.isStreaming && !message.content && !displayedContent) {
      setShowSkeleton(true)
      setIsTyping(true)
      return
    }

    if (message.isStreaming && message.content !== displayedContent) {
      setShowSkeleton(false)
      setIsTyping(true)

      const content = message.content
      let currentIndex = displayedContent.length

      const typeInterval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsTyping(false)
          clearInterval(typeInterval)
        }
      }, 20)

      return () => clearInterval(typeInterval)
    } else if (!message.isStreaming) {
      setDisplayedContent(message.content)
      setIsTyping(false)
      setShowSkeleton(false)
    }
  }, [message.content, message.isStreaming, displayedContent, message.role])

  const displayMessage = {
    ...message,
    content: displayedContent,
  }

  const isAssistant = message.role === "assistant"

  return (
    <motion.div
      className="relative group w-full"
      initial={isAssistant ? { opacity: 0, y: 12 } : false}
      animate={isAssistant ? { opacity: 1, y: 0 } : {}}
      transition={
        isAssistant
          ? {
              duration: 0.25,
              ease: "easeOut",
              // Respect reduced motion
              ...(window.matchMedia("(prefers-reduced-motion: reduce)").matches && {
                duration: 0,
                y: 0,
              }),
            }
          : {}
      }
      style={{ minHeight: isAssistant && message.isStreaming ? "60px" : "auto" }}
    >
      <MessageBubble
        message={displayMessage}
        isStreaming={message.isStreaming || isTyping}
        showSkeleton={showSkeleton}
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
