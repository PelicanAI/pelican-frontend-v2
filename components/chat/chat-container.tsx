"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { StreamingMessage } from "./streaming-message"
import { WelcomeScreen } from "./welcome-screen"
import { ScrollContainer } from "./scroll-container"
import { useSmartScroll } from "@/hooks/use-smart-scroll"
import type { Message } from "@/lib/chat-utils"
import { useToast } from "@/hooks/use-toast"
import { DragDropOverlay } from "./drag-drop-overlay"
import { isAcceptedFileType } from "@/lib/file-utils"
import { EnhancedTypingDots } from "./enhanced-typing-dots"
import { JumpToLatestButton } from "./JumpToLatestButton"
import { SystemMessage } from "./SystemMessage"
import { ConversationHistorySkeleton } from "./conversation-history-skeleton"
import { NewMessagesPill } from "./new-messages-pill"
import { ErrorMessage } from "./error-message"

interface ChatContainerProps {
  messages: Message[]
  isLoading: boolean
  isLoadingHistory: boolean
  onStopGeneration?: () => void
  onRegenerateMessage?: () => void
  onQuickStart?: (message: string) => void
  onEditMessage?: (id: string, content: string) => void
  onDeleteMessage?: (id: string) => void
  onPinMessage?: (id: string) => void
  onFileUpload?: (files: File[]) => void
  onSettingsClick?: () => void
  networkError?: string | null
}

export function ChatContainer({
  messages,
  isLoading,
  isLoadingHistory,
  onStopGeneration,
  onRegenerateMessage,
  onQuickStart,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onFileUpload,
  onSettingsClick,
  networkError,
}: ChatContainerProps) {
  const { toast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false)

  const {
    containerRef,
    bottomRef,
    state,
    scrollToBottom,
    handleNewMessage,
    handleStreamingEnd,
    checkIfNearBottom,
    showJump,
    lastNewMessageAt,
  } = useSmartScroll({
    nearBottomThreshold: 100,
    mobileNearBottomThreshold: 150,
    scrollBehavior: "smooth",
    enableMomentumScrolling: true,
    debounceMs: 100,
  })

  const validateFiles = useCallback(
    (files: FileList): File[] => {
      const validFiles: File[] = []
      const maxSize = 15 * 1024 * 1024 // 15MB

      Array.from(files).forEach((file) => {
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 15MB`,
            variant: "destructive",
          })
          return
        }

        if (!isAcceptedFileType(file)) {
          toast({
            title: "File type not supported",
            description: `${file.name} is not a supported file type. Please upload Excel (.xlsx, .xls), CSV, PDF, images, or text files.`,
            variant: "destructive",
          })
          return
        }

        validFiles.push(file)
      })

      return validFiles
    },
    [toast],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragOver(false)
      }
      return newCounter
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      setDragCounter(0)

      const files = e.dataTransfer.files
      if (files.length > 0 && onFileUpload) {
        const validFiles = validateFiles(files)
        if (validFiles.length > 0) {
          onFileUpload(validFiles)
          toast({
            title: "Files uploaded",
            description: `${validFiles.length} file(s) uploaded successfully`,
          })
        }
      }
    },
    [onFileUpload, validateFiles, toast],
  )

  const handleError = useCallback(
    (error: Error, context: string) => {
      console.error(`[v0] ${context} error:`, error)

      let title = "Something went wrong"
      let description = "Please try again"

      if (error.message.includes("network")) {
        title = "Connection issue"
        description = "Check your internet connection and try again"
      } else if (error.message.includes("rate limit")) {
        title = "Too many requests"
        description = "Please wait a moment before trying again"
      } else if (error.message.includes("file")) {
        title = "File upload failed"
        description = "Please check the file format and size"
      }

      toast({
        title,
        description,
        variant: "destructive",
        duration: 5000,
      })
    },
    [toast],
  )

  const handleReaction = (messageId: string, reaction: "like" | "dislike") => {
    toast({
      title: "Feedback received",
      description: `Thank you for your ${reaction === "like" ? "positive" : "constructive"} feedback!`,
    })
  }

  const handleJumpToBottom = useCallback(() => {
    scrollToBottom("smooth")
    setNewMessageCount(0)
    setShowNewMessagesPill(false)
  }, [scrollToBottom])

  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    const isStreaming = lastMessage?.isStreaming || false

    // Check if user is near bottom to show new messages pill
    if (!state.isNearBottom && !isStreaming) {
      setNewMessageCount((prev) => prev + 1)
      setShowNewMessagesPill(true)
    } else {
      setNewMessageCount(0)
      setShowNewMessagesPill(false)
    }

    handleNewMessage(isStreaming)

    if (!isStreaming && state.isStreaming) {
      handleStreamingEnd()
    }
  }, [messages, handleNewMessage, handleStreamingEnd, state.isStreaming, state.isNearBottom])

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background relative">
        <ConversationHistorySkeleton messageCount={4} />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col min-h-0 bg-background relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="main"
        aria-label="Chat conversation"
      >
        <WelcomeScreen onQuickStart={onQuickStart || (() => {})} onSettingsClick={onSettingsClick} />
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DragDropOverlay />
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-background relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="main"
      aria-label="Chat conversation"
    >
      <AnimatePresence>
        {networkError && (
          <ErrorMessage
            message={networkError}
            variant="banner"
            onRetry={() => {
              // Retry logic here
            }}
          />
        )}
      </AnimatePresence>

      <ScrollContainer
        ref={containerRef}
        showScrollIndicator={!state.isNearBottom && !state.isUserScrolling}
        onScrollToBottom={() => scrollToBottom("smooth")}
      >
        <div
          className="w-full px-4 sm:px-6 py-6 space-y-6"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {/* Conversation Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Trading Assistant
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Markets Open</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.map((message, index) =>
              message.role === "system" ? (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <SystemMessage message={message} />
                </motion.div>
              ) : (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <StreamingMessage
                    message={message}
                    onStop={message.isStreaming ? onStopGeneration : undefined}
                    onRegenerate={
                      index === messages.length - 1 && message.role === "assistant" && !message.isStreaming
                        ? onRegenerateMessage
                        : undefined
                    }
                    onReaction={handleReaction}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onPin={onPinMessage}
                    showActions={index === messages.length - 1}
                  />
                </motion.div>
              ),
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.5, // 500ms delay before showing typing indicator
                }}
                className="flex gap-3 w-full"
              >
                <div className="h-8 w-8 shrink-0 mt-1 bg-transparent rounded-full flex items-center justify-center">
                  <motion.img
                    src="/pelican-logo.png"
                    alt="PelicanAI"
                    className="w-6 h-6 object-contain"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Pelican AI</span>
                  </div>
                  <div className="px-4 py-3 max-w-[85%] bg-white/90 dark:bg-[var(--surface-2)] border border-gray-200/80 dark:border-white/5 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <EnhancedTypingDots variant="processing" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-4" />
        </div>
      </ScrollContainer>

      <NewMessagesPill show={showNewMessagesPill} messageCount={newMessageCount} onJumpToBottom={handleJumpToBottom} />

      <AnimatePresence>
        {showJump && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <JumpToLatestButton onJumpToLatest={() => scrollToBottom("smooth")} lastNewMessageAt={lastNewMessageAt} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DragDropOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
