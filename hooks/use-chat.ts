"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { type Message, createUserMessage, createAssistantMessage, createSystemMessage, generateMessageId } from "@/lib/chat-utils"
import useSWR, { mutate } from "swr"
import { useConversations } from "./use-conversations"
import { useRequestManager } from "./use-request-manager"
import { useStreamingChat } from "./use-streaming-chat"
import { STORAGE_KEYS, API_ENDPOINTS, LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"

// FEATURE FLAG - set true to enable streaming
const USE_STREAMING = true

interface UseChatOptions {
  conversationId?: string | null
  onError?: (error: Error) => void
  onFinish?: (message: Message) => void
  onConversationCreated?: (conversationId: string) => void
}

// Type safety interfaces for Pelican API responses
interface PelicanAPIResponse {
  type?: string
  data?: any
  structuredContent?: StructuredContent
  message?: string
  error?: string
}

interface StructuredContent {
  type: string
  data: any
}

// Type guard for structured content
function isStructuredContent(data: any): data is StructuredContent {
  return data && typeof data === 'object' && 'type' in data && 'data' in data
}

interface SendMessageOptions {
  attachments?: Array<{ type: string; name: string; url: string }>
  fileIds?: string[]
  skipUserMessage?: boolean // For regenerate - don't add duplicate user message
}

export function useChat({ conversationId, onError, onFinish, onConversationCreated }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)
  const [conversationNotFound, setConversationNotFound] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const loadedConversationRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>([])

  const { user } = useConversations()
  
  // Add streaming hook
  const { 
    sendMessage: sendStreamingMessage, 
    isStreaming,
    cancelStream 
  } = useStreamingChat()

  const { makeRequest, cancelAllRequests, getQueueStatus } = useRequestManager({
    maxRetries: 3,
    onError: (error) => {
      logger.error("RequestManager error", error instanceof Error ? error : new Error(String(error)))
    },
    onRateLimit: (resetTime) => {
      logger.info("Rate limited", { resetTime })
      // Could show user notification here
    },
  })

  // 🔧 FIX: Only fetch from DB when switching conversations, not during active conversation
  const shouldFetchConversation =
    !!currentConversationId &&
    !currentConversationId.startsWith("guest-") &&
    !currentConversationId.startsWith("temp-") &&
    !isStreaming && // Don't fetch while streaming - messages aren't in DB yet
    !isLoading && // Don't fetch while loading - prevents race condition
    currentConversationId !== loadedConversationRef.current // Only fetch if we haven't loaded this conversation yet

  const {
    data: conversationData,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR(shouldFetchConversation ? `/api/conversations/${currentConversationId}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false, // Disable auto-revalidation on reconnect to prevent data loss
    dedupingInterval: 5000, // Prevent rapid refetches
    onError: (error) => {
      logger.error("Conversation fetch error", error instanceof Error ? error : new Error(String(error)))
      if (error.status === 404 || error.status === 403) {
        setConversationNotFound(true)
      }
    },
  })

  useEffect(() => {
    setCurrentConversationId(conversationId || null)
    setConversationNotFound(false)
    
    if (conversationId !== loadedConversationRef.current) {
      // Only clear messages when switching between two REAL conversations
      // Don't clear when going from null → first conversation (cold start)
      // This prevents the welcome screen from flashing on initial load
      const isSwitchingConversations = 
        loadedConversationRef.current !== null && 
        conversationId !== null &&
        conversationId !== loadedConversationRef.current
      
      if (isSwitchingConversations) {
        // Clear messages immediately when switching to prevent showing old messages
        setMessages([])
        loadedConversationRef.current = null
      }
      // If cold start (null → conversationId), let the fetch populate messages
      // without clearing first - this prevents welcome screen flash
    }
  }, [conversationId])

  // No guest mode - removed guest conversation loading

  useEffect(() => {
    if (conversationError && (conversationError.status === 404 || conversationError.status === 403)) {
      logger.info("Conversation access denied or not found", { conversationId: currentConversationId })
      setConversationNotFound(true)
      return
    }

    // 🔧 FIX: Only load messages from DB when switching to a NEW conversation
    // This prevents stale DB data from overwriting fresh UI state during active conversation
    if (conversationData?.conversation?.messages && loadedConversationRef.current !== currentConversationId) {
      logger.info("Loading messages for conversation", { 
        conversationId: currentConversationId,
        dbMessageCount: conversationData.conversation.messages.length,
        currentUIMessageCount: messagesRef.current.length
      })
      
      const loadedMessages = conversationData.conversation.messages
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isStreaming: false,
        }))
        .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime()) // Sort chronologically (oldest first)
      
      // 🔧 FIX: Only update if this is truly a conversation switch
      // Don't update if we're in the middle of a conversation (isLoading or isStreaming)
      if (!isLoading && !isStreaming) {
        setMessages(loadedMessages)
        loadedConversationRef.current = currentConversationId
        setConversationNotFound(false)
      } else {
        logger.info("Skipping message load - conversation in progress", {
          isLoading,
          isStreaming,
          conversationId: currentConversationId
        })
      }
    } else if (!currentConversationId && loadedConversationRef.current !== null) {
      logger.info("Clearing messages for new conversation")
      setMessages([])
      loadedConversationRef.current = null
      setConversationNotFound(false)
    }
  }, [conversationData, conversationError, currentConversationId, isLoading, isStreaming])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const addSystemMessage = useCallback((content: string, retryAction?: () => void) => {
    const systemMessage = createSystemMessage(content, retryAction)
    setMessages((prev) => [...prev, systemMessage])
    return systemMessage.id
  }, [])

  const removeSystemMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }, [])

  const sendMessage = useCallback(
    async (content: string, options: SendMessageOptions = {}) => {
      if (isLoading) return

      cancelAllRequests()

      // 🔧 FIX: Capture conversation history BEFORE modifying state
      // This ensures we send the correct context, not stale data from SWR refetch
      const conversationHistory = messagesRef.current
        .filter((msg) => msg.role !== "system")
        .slice(-(LIMITS.MESSAGE_CONTEXT - 1)) // Reserve 1 slot for new message
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const userMessage = createUserMessage(content)
      if (options.attachments) {
        userMessage.attachments = options.attachments
      }

      // Only add user message if not regenerating (skipUserMessage flag)
      if (!options.skipUserMessage) {
        setMessages((prev) => [...prev, userMessage])
      }
      setIsLoading(true)

      const assistantMessage = createAssistantMessage()
      setMessages((prev) => [...prev, assistantMessage])

      const localAbortController = new AbortController()
      abortControllerRef.current = localAbortController

      try {
        logger.info("Sending message to Pelican API", { 
          messageLength: content.length,
          historyLength: conversationHistory.length,
          conversationId: currentConversationId 
        })

        // Simple POST to pelican_response endpoint - no streaming
        const response = await makeRequest("/api/pelican_response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationId: currentConversationId,
            conversationHistory: conversationHistory,
            conversation_history: conversationHistory, // Backend expects both formats
            fileIds: options.fileIds,
          }),
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        // Non-streaming response - wait for complete JSON response
        const data = await response.json()
        logger.info("Received API response", { hasError: !!data.error })

        if (data.error) {
          throw new Error(data.error)
        }

        // Handle both OpenAI-style and simpler Pelican format, including attachments
        const rawReply = data.choices?.[0]?.message?.content || data.content || data
        
        // 🔍 [DEBUG] Raw API response logging
        logger.info("🔍 [DEBUG] Raw API response", { 
          hasChoices: !!data.choices,
          hasContent: !!data.content,
          rawReplyType: typeof rawReply,
          rawReplyKeys: typeof rawReply === 'object' && rawReply !== null ? Object.keys(rawReply) : null,
          isObject: typeof rawReply === 'object' && rawReply !== null,
          hasContentProperty: typeof rawReply === 'object' && rawReply !== null && 'content' in rawReply,
          hasAttachmentsProperty: typeof rawReply === 'object' && rawReply !== null && 'attachments' in rawReply
        })
        
        // Extract content and attachments - handle both old format (string) and new format (object)
        let reply: string
        let attachments: Array<{ type: string; name: string; url: string }> = []
        
        if (typeof rawReply === 'object' && rawReply !== null && 'content' in rawReply) {
          // New format with attachments: { content: string, attachments: [...] }
          reply = typeof rawReply.content === 'string' ? rawReply.content : String(rawReply.content || '')
          attachments = Array.isArray(rawReply.attachments) ? rawReply.attachments : []
        } else if (typeof rawReply === 'string') {
          // Old format (plain string)
          reply = rawReply
          attachments = []
        } else {
          // Fallback - ensure we always have a string
          reply = String(rawReply || "No response received")
          attachments = []
        }
        
        // Final safety check - ensure reply is always a string
        if (typeof reply !== 'string') {
          reply = String(reply || "No response received")
        }

        // ✅ [DEBUG] Extracted from response logging
        logger.info("✅ [DEBUG] Extracted from response", { 
          replyLength: reply?.length || 0,
          attachmentsCount: attachments.length,
          firstAttachment: attachments[0] ? {
            type: attachments[0].type,
            name: attachments[0].name,
            urlLength: attachments[0].url?.length || 0,
            urlPrefix: attachments[0].url?.substring(0, 50) || 'no url'
          } : null
        })

        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId)
          onConversationCreated?.(data.conversationId)
          logger.info("New conversation created", { conversationId: data.conversationId })
        }

        const finalMessage = { 
          ...assistantMessage, 
          content: reply, 
          attachments: attachments,
          isStreaming: false 
        }
        setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? finalMessage : msg)))

        onFinish?.(finalMessage)

        // 🔧 FIX: Don't refetch conversation immediately - causes race condition
        // Trust the local UI state. Only refetch on conversation switch or manual refresh.
        // if (currentConversationId) {
        //   mutateConversation()
        // }
        
        // Update the conversations list (sidebar) but not the current conversation messages
        mutate(API_ENDPOINTS.CONVERSATIONS)
      } catch (error) {
        logger.error("Chat error", error instanceof Error ? error : new Error(String(error)), {
          conversationId: currentConversationId,
          messageLength: content.length,
          skipUserMessage: options.skipUserMessage,
        })

        if (error instanceof Error && error.name === "AbortError") {
          logger.info("Request cancelled by user")
          // Remove the cancelled assistant message (like ChatGPT/Claude)
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
          return
        }

        // Remove failed assistant message for other errors too
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))

        // Provide specific error messages based on error type
        if (error instanceof Error && error.message.includes("Rate limited")) {
          const queueStatus = getQueueStatus()
          addSystemMessage(
            `High demand detected. ${queueStatus.queued > 0 ? `Position in queue: ${queueStatus.queued}` : "Your message will be processed shortly."}`,
          )
        } else if (error instanceof Error && error.message.includes("timeout")) {
          // Don't auto-retry - user can manually retry if needed
          // Long requests (60+ seconds) are normal for pelican_response
          addSystemMessage("Request is taking longer than expected. Please wait, or cancel and try again.")
        } else if (error instanceof Error && error.message.includes("401")) {
          addSystemMessage("Authentication error. Please sign in again to continue.")
        } else if (error instanceof Error && error.message.includes("403")) {
          addSystemMessage("Access denied. You don't have permission to perform this action.")
        } else if (error instanceof Error && error.message.includes("500")) {
          const retryAction = () => {
            sendMessage(content, { ...options, skipUserMessage: true })
          }
          addSystemMessage("Server error. Our servers are experiencing issues. Please try again in a moment.", retryAction)
        } else if (error instanceof Error && error.name === "TypeError") {
          const retryAction = () => {
            sendMessage(content, { ...options, skipUserMessage: true })
          }
          addSystemMessage("Network error. Please check your internet connection and try again.", retryAction)
        } else {
          const retryAction = () => {
            sendMessage(content, { ...options, skipUserMessage: true })
          }
          addSystemMessage("Something went wrong. Please try again.", retryAction)
        }

        onError?.(error instanceof Error ? error : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [
      isLoading,
      currentConversationId,
      mutateConversation,
      onError,
      onFinish,
      onConversationCreated,
      user,
      makeRequest,
      cancelAllRequests,
      getQueueStatus,
      addSystemMessage,
    ],
  )

  // Streaming version of sendMessage
  const sendMessageStreaming = useCallback(
    async (content: string, options: SendMessageOptions = {}) => {
      if (isStreaming || isLoading) return

      // Generate unique request ID
      const requestId = generateMessageId()
      
      // Cancel previous request if exists
      if (currentRequestId) {
        abortControllerRef.current?.abort()
        cancelStream()
        // Clean up previous streaming assistant message
        setMessages(prev => 
          prev.filter(msg => !msg.isStreaming || msg.id !== currentRequestId)
        )
      }
      
      setCurrentRequestId(requestId)
      
      cancelAllRequests()
      cancelStream()

      // 🔧 FIX: Capture conversation history BEFORE modifying state
      // This ensures we send the correct context, not stale data from SWR refetch
      const conversationHistory = messagesRef.current
        .filter((msg) => msg.role !== "system")
        .slice(-(LIMITS.MESSAGE_CONTEXT - 1)) // Reserve 1 slot for new message

      const userMessage = createUserMessage(content)
      if (options.attachments) {
        userMessage.attachments = options.attachments
      }

      // Only add user message if not regenerating (skipUserMessage flag)
      if (!options.skipUserMessage) {
        setMessages((prev) => [...prev, userMessage])
      }

      // Create empty assistant message with streaming flag, linked to request ID
      const assistantMessage = createAssistantMessage("")
      assistantMessage.id = requestId // Link to request ID
      assistantMessage.isStreaming = true
      setMessages((prev) => [...prev, assistantMessage])

      try {
        logger.info("Sending streaming message", { 
          messageLength: content.length,
          historyLength: conversationHistory.length 
        })

        // Stream response
        await sendStreamingMessage(
          content,
          conversationHistory,
          {
            onStart: () => {
              logger.info("[Streaming] Started")
            },

            onConversationCreated: (newConversationId) => {
              setCurrentConversationId(newConversationId)
              onConversationCreated?.(newConversationId)
              logger.info("[Streaming] New conversation created", { conversationId: newConversationId })
            },

            onStatus: (status) => {
              logger.info("[Streaming] Status", { status })
            },

            onChunk: (delta) => {
              // Append delta to assistant message
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMessage.id
                    ? { ...msg, content: msg.content + delta }
                    : msg
                )
              )
            },

            onComplete: (fullResponse, latency) => {
              // Mark as complete, use full_response (handles edge cases)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: fullResponse, isStreaming: false }
                    : msg
                )
              )
              logger.info("[Streaming] Complete", { latency })
              
              // Clear request ID after successful completion
              setCurrentRequestId(null)
              
              const finalMessage = { 
                ...assistantMessage, 
                content: fullResponse, 
                isStreaming: false 
              }
              onFinish?.(finalMessage)

              // 🔧 FIX: Don't refetch conversation immediately - causes race condition
              // Trust the local UI state. Only refetch on conversation switch.
              // if (currentConversationId) {
              //   mutateConversation()
              // }
              
              // Update the conversations list (sidebar) but not the current conversation messages
              mutate(API_ENDPOINTS.CONVERSATIONS)
            },

            onAttachments: (attachments) => {
              // Store attachments with the message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, attachments }
                    : msg
                )
              )
              logger.info("[Streaming] Attachments", { count: attachments.length })
            },

            onError: (error) => {
              logger.error("[Streaming] Error", new Error(error))
              
              // Clear request ID on error
              setCurrentRequestId(null)
              
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { 
                        ...msg, 
                        content: `Error: ${error}. Please try again.`, 
                        isStreaming: false 
                      }
                    : msg
                )
              )
              onError?.(new Error(error))
            }
          },
          currentConversationId,
          options.fileIds || []
        )
      } catch (error) {
        logger.error("Streaming error", error instanceof Error ? error : new Error(String(error)))
        
        // Clear request ID on any error
        setCurrentRequestId(null)
        
        if (error instanceof Error && error.name === "AbortError") {
          logger.info("Stream cancelled by user")
          // Keep partial content if any was generated
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
        } else {
          // Remove failed assistant message
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
          
          const retryAction = () => {
            sendMessageStreaming(content, { ...options, skipUserMessage: true })
          }
          addSystemMessage("Something went wrong. Please try again.", retryAction)
        }

        onError?.(error instanceof Error ? error : new Error("Unknown error"))
      }
    },
    [
      isLoading,
      isStreaming,
      currentConversationId,
      currentRequestId,
      mutateConversation,
      onError,
      onFinish,
      onConversationCreated,
      sendStreamingMessage,
      cancelStream,
      cancelAllRequests,
      addSystemMessage,
    ],
  )

  // Keep existing non-streaming sendMessage unchanged
  const sendMessageNonStreaming = sendMessage

  // Choose based on feature flag
  const sendMessageFinal = USE_STREAMING 
    ? sendMessageStreaming 
    : sendMessageNonStreaming

  const stopGeneration = useCallback(async () => {
    if (abortControllerRef.current) {
      logger.info("Stopping generation - aborting controller")
      abortControllerRef.current.abort()
    }
    cancelAllRequests()
    
    // Find the currently streaming message
    const streamingMessage = messages.find(m => m.isStreaming)
    
    // Save partial response to database if exists
    if (streamingMessage && streamingMessage.content && currentConversationId) {
      try {
        await fetch('/api/messages/save-partial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: currentConversationId,
            messageId: streamingMessage.id,
            content: streamingMessage.content,
            role: streamingMessage.role,
            isPartial: true,
          })
        })
        logger.info("Saved partial message to database", { 
          messageId: streamingMessage.id,
          contentLength: streamingMessage.content.length 
        })
      } catch (error) {
        logger.error("Failed to save partial message", error instanceof Error ? error : new Error(String(error)))
      }
    }
    
    setIsLoading(false)
    setMessages((prev) =>
      prev
        .map((msg) =>
          msg.isStreaming
            ? msg.content
              ? { ...msg, isStreaming: false } // Keep partial content if any was generated
              : null // Remove message if no content yet
            : msg,
        )
        .filter((msg): msg is Message => msg !== null),
    )
  }, [cancelAllRequests, messages, currentConversationId])

  const clearMessages = useCallback(() => {
    setMessages([])
    stopGeneration()
  }, [stopGeneration])

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }, [])

  const regenerateLastMessage = useCallback(() => {
    setMessages((currentMessages) => {
      if (currentMessages.length < 2) return currentMessages

      // Find the last assistant message
      const lastAssistantIndex = [...currentMessages].reverse().findIndex((msg) => msg.role === "assistant")
      if (lastAssistantIndex === -1) return currentMessages

      // Calculate actual index (since we reversed)
      const actualIndex = currentMessages.length - 1 - lastAssistantIndex

      // Find the user message that prompted this assistant response
      const userMessage = [...currentMessages.slice(0, actualIndex)].reverse().find((msg) => msg.role === "user")
      if (!userMessage) return currentMessages

      // Remove only the assistant message, keep the user message
      const newMessages = currentMessages.slice(0, actualIndex)

      // Regenerate with skipUserMessage flag to avoid duplicating the user's question
      setTimeout(() => sendMessageFinal(userMessage.content, { skipUserMessage: true }), 0)

      return newMessages
    })
  }, [sendMessageFinal])

  // Update stopGeneration to handle streaming
  const stopGenerationFinal = useCallback(() => {
    if (USE_STREAMING && isStreaming) {
      cancelStream()
    } else {
      stopGeneration()
    }
  }, [isStreaming, cancelStream, stopGeneration])

  // 🔧 FIX: Add manual refresh capability for when user switches conversations
  const refreshConversation = useCallback(() => {
    if (currentConversationId && !isLoading && !isStreaming) {
      logger.info("Manually refreshing conversation from database", { conversationId: currentConversationId })
      // Reset loaded ref to allow refetch
      loadedConversationRef.current = null
      mutateConversation()
    }
  }, [currentConversationId, isLoading, isStreaming, mutateConversation])

  return {
    messages,
    isLoading: isLoading || isStreaming,
    sendMessage: sendMessageFinal,
    stopGeneration: stopGenerationFinal,
    clearMessages,
    removeMessage,
    regenerateLastMessage,
    conversationId: currentConversationId,
    addSystemMessage,
    removeSystemMessage,
    conversationNotFound,
    refreshConversation, // Expose manual refresh for conversation switches
    // Only expose cancel if streaming enabled
    ...(USE_STREAMING ? { cancelStream } : {}),
  }
}
