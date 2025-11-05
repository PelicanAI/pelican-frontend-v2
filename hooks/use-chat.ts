"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { type Message, createUserMessage, createAssistantMessage, createSystemMessage } from "@/lib/chat-utils"
import useSWR, { mutate } from "swr"
import { useConversations } from "./use-conversations"
import { useRequestManager } from "./use-request-manager"
import { STORAGE_KEYS, API_ENDPOINTS, LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"

interface UseChatOptions {
  conversationId?: string | null
  onError?: (error: Error) => void
  onFinish?: (message: Message) => void
  onConversationCreated?: (conversationId: string) => void
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
  const loadedConversationRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>([])

  const { user } = useConversations()

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

  const shouldFetchConversation =
    !!currentConversationId &&
    !currentConversationId.startsWith("guest-") &&
    !currentConversationId.startsWith("temp-")

  const {
    data: conversationData,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR(shouldFetchConversation ? `/api/conversations/${currentConversationId}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
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
      // Clear messages immediately when switching conversations to prevent showing old messages
      setMessages([])
      loadedConversationRef.current = null
    }
  }, [conversationId])

  // No guest mode - removed guest conversation loading

  useEffect(() => {
    if (conversationError && (conversationError.status === 404 || conversationError.status === 403)) {
      logger.info("Conversation access denied or not found", { conversationId: currentConversationId })
      setConversationNotFound(true)
      return
    }

    if (conversationData?.conversation?.messages && loadedConversationRef.current !== currentConversationId) {
      logger.info("Loading messages for conversation", { conversationId: currentConversationId })
      const loadedMessages = conversationData.conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isStreaming: false,
      }))
      setMessages(loadedMessages)
      loadedConversationRef.current = currentConversationId
      setConversationNotFound(false)
    } else if (!currentConversationId && loadedConversationRef.current !== null) {
      logger.info("Clearing messages for new conversation")
      setMessages([])
      loadedConversationRef.current = null
      setConversationNotFound(false)
    }
  }, [conversationData, conversationError, currentConversationId])

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
        logger.info("Sending message to Pelican API", { messageLength: content.length })

        // Build conversation history from existing messages (excluding the new user message)
        const conversationHistory = messagesRef.current
          .filter((msg) => msg.role !== "system" && msg.id !== userMessage.id && msg.id !== assistantMessage.id)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
          .slice(-LIMITS.MESSAGE_CONTEXT) // Limit to last N messages

        logger.info("Sending conversation history", { 
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
        const processedResponse = typeof rawReply === "object" ? rawReply : { content: rawReply }
        
        const reply = processedResponse.content || rawReply || "No response received"
        const attachments = processedResponse.attachments || []

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

        if (currentConversationId) {
          mutateConversation()
        }
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

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      logger.info("Stopping generation - aborting controller")
      abortControllerRef.current.abort()
    }
    cancelAllRequests()
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
  }, [cancelAllRequests])

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
      setTimeout(() => sendMessage(userMessage.content, { skipUserMessage: true }), 0)

      return newMessages
    })
  }, [sendMessage])

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    clearMessages,
    removeMessage,
    regenerateLastMessage,
    conversationId: currentConversationId,
    addSystemMessage,
    removeSystemMessage,
    conversationNotFound,
  }
}
