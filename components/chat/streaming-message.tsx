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
  const [isRevealing, setIsRevealing] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  useEffect(() => {
    if (message.role === "user") {
      setDisplayedContent(message.content)
      setIsRevealing(false)
      setShowTypingIndicator(false)
      return
    }

    // For real backend streaming - display content immediately as it arrives
    if (message.isStreaming && message.content !== displayedContent) {
      // Show content immediately when streaming (no artificial delays)
      // This gives users instant feedback as tokens arrive from the backend
      setDisplayedContent(message.content)
      setIsRevealing(false)
      setShowTypingIndicator(false)
    } 
    // For non-streaming: Show content immediately (no animation for now)
    else if (!message.isStreaming && message.content) {
      setDisplayedContent(message.content)
      setIsRevealing(false)
      setShowTypingIndicator(false)
    }
  }, [message.content, message.isStreaming, displayedContent, message.role, showTypingIndicator, isRevealing])

  const displayMessage = {
    ...message,
    content: displayedContent,
  }

  // Allow user to click to instantly reveal full message
  const handleClick = () => {
    if (isRevealing && message.role === "assistant") {
      setDisplayedContent(message.content)
      setIsRevealing(false)
      setShowTypingIndicator(false)
    }
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
      onClick={handleClick}
      style={{ cursor: isRevealing ? 'pointer' : 'default' }}
      title={isRevealing ? 'Click to show full message' : ''}
    >
      <MessageBubble
        message={displayMessage}
        isStreaming={message.isStreaming || isRevealing}
        showSkeleton={showTypingIndicator}
        isDarkMode={isDarkMode}
        onStop={message.isStreaming ? onStop : undefined}
        onRegenerate={!message.isStreaming && !isRevealing && message.role === "assistant" ? onRegenerate : undefined}
        onReaction={onReaction}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={onPin}
      />
    </motion.div>
  )
}
