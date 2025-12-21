"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useCallback, useRef } from "react"
import { StreamingMessage } from "./streaming-message"
import { WelcomeScreen } from "./welcome-screen"
import { ScrollContainer } from "./scroll-container"
import { useSmartScroll } from "@/hooks/use-smart-scroll"
import type { Message } from "@/lib/chat-utils"
import { useToast } from "@/hooks/use-toast"
import { useResponseTimer } from '@/hooks/use-response-timer'
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
  const elapsedSeconds = useResponseTimer(isLoading)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false)
  
  // Track previous messages to detect when user sends
  const prevMessagesLengthRef = useRef(messages.length)
  const prevLastMessageIdRef = useRef<string | undefined>(messages[messages.length - 1]?.id)

  const {
    containerRef,
    bottomRef,
    state,
    scrollToBottom,
    handleNewMessage,
    handleStreamingEnd,
    checkIfNearBottom,
    resetScrollAwayState,
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
    resetScrollAwayState() // Reset scroll-away state when user manually scrolls to bottom
    setNewMessageCount(0)
    setShowNewMessagesPill(false)
  }, [scrollToBottom, resetScrollAwayState])

  useEffect(() => {
    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0
      prevLastMessageIdRef.current = undefined
      return
    }

    const lastMessage = messages[messages.length - 1]
    const isStreaming = lastMessage?.isStreaming || false
    const currentLastMessageId = lastMessage?.id
    
    // ⚡ PERFORMANCE FIX: Early return if nothing changed
    // During streaming, content updates occur without message count changes
    // Skip expensive scroll operations if only message content changed
    const messageWasAdded = messages.length > prevMessagesLengthRef.current
    const lastMessageChanged = currentLastMessageId !== prevLastMessageIdRef.current
    const messagesAdded = messages.length - prevMessagesLengthRef.current
    
    // If only a message is being streamed (no new messages added), skip scroll handling
    // to avoid re-render loop. The streaming content update will be handled by the
    // streaming message component itself
    if (isStreaming && !messageWasAdded) {
      // Just update the ref and return - don't call handleNewMessage during content updates
      return
    }
    
    // BUG FIX: When user sends, TWO messages are added simultaneously:
    // 1. User message
    // 2. Assistant placeholder (for "thinking" state)
    // So we need to find the most recent USER message, not just check the last message
    
    let userMessageToScrollTo: Message | undefined = undefined
    let isUserMessage = false
    
    if (messageWasAdded) {
      // Find the most recent user message (could be last or second-to-last)
      const recentUserMessage = [...messages].reverse().find(m => m.role === 'user')
      
      // Check if this user message is NEW (wasn't in the previous state)
      if (recentUserMessage) {
        const wasInPreviousState = messages.slice(0, prevMessagesLengthRef.current)
          .some(m => m.id === recentUserMessage.id)
        
        if (!wasInPreviousState) {
          userMessageToScrollTo = recentUserMessage
          isUserMessage = true
        }
      }
    }

    // ⚡ PERFORMANCE: Only log when messages are actually added, not on every stream update
    if (messageWasAdded) {
      console.log('[Chat Container] ✅ NEW MESSAGE(S) detected:', {
        messageCount: messages.length,
        prevCount: prevMessagesLengthRef.current,
        messagesAdded,
        userMessageFound: userMessageToScrollTo ? '✅ YES' : '❌ No',
        userMessageId: userMessageToScrollTo?.id,
      })
    }

    // Check if user is near bottom to show new messages pill
    if (!state.isNearBottom && !isStreaming) {
      setNewMessageCount((prev) => prev + 1)
      setShowNewMessagesPill(true)
    } else {
      setNewMessageCount(0)
      setShowNewMessagesPill(false)
    }

    // CRITICAL: Trigger scroll if we found a NEW user message
    if (messageWasAdded) {
      if (isUserMessage && userMessageToScrollTo) {
        console.log('[Chat Container] 📨 NEW USER MESSAGE detected, triggering scroll!')
        handleNewMessage(false, true, userMessageToScrollTo.id)
      } else {
        console.log('[Chat Container] 📨 New assistant message added')
        handleNewMessage(isStreaming, false, lastMessage?.id)
      }
    }

    if (!isStreaming && state.isStreaming) {
      handleStreamingEnd()
    }

    // Update refs for next comparison
    prevMessagesLengthRef.current = messages.length
    prevLastMessageIdRef.current = currentLastMessageId
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
          className="w-full pb-6"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {/* Conversation Header - Sticky */}
          <div className="sticky top-0 z-10 flex items-center justify-between pb-2 pt-4 sm:pt-6 border-b border-border bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-foreground">
                  Trading Assistant
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400">Open</span>
              </div>
            </div>
          </div>

          {/* Loading skeleton when switching conversations */}
          {isLoadingHistory && messages.length === 0 && (
            <div className="space-y-6">
              <ConversationHistorySkeleton />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {!isLoadingHistory && messages.map((message, index) =>
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

          {/* Thinking indicator with timer - shows during initial processing */}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-center gap-3 py-4 px-4 sm:px-8 max-w-3xl mx-auto">
              <img
                src="/pelican-logo.png"
                alt="Pelican AI"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain opacity-80"
              />
              <div className="flex items-center gap-2">
                <EnhancedTypingDots variant="thinking" />
                <span className="text-xs text-muted-foreground/70 font-mono tabular-nums min-w-[2.5rem]">
                  {elapsedSeconds}s
                </span>
              </div>
            </div>
          )}

          {/* Streaming indicator with timer - shows while response is being generated */}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.isStreaming && (
            <div className="flex items-center gap-2 px-4 sm:px-8 max-w-3xl mx-auto pb-2">
              <span className="text-xs text-muted-foreground/50 font-mono tabular-nums">
                {elapsedSeconds}s
              </span>
            </div>
          )}

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
