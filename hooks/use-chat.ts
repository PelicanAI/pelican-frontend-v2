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
  guestMode?: boolean
  attachments?: Array<{ type: string; name: string; url: string }>
  fileIds?: string[]
  skipUserMessage?: boolean // For regenerate - don't add duplicate user message
}

export function useChat({ conversationId, onError, onFinish, onConversationCreated }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [conversationNotFound, setConversationNotFound] = useState(false)
  const loadedConversationRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>([])

  const { ensureGuestConversation, updateGuestConversationMessages, loadGuestConversationMessages, user } = useConversations()

  const { makeRequest, cancelAllRequests, getQueueStatus } = useRequestManager({
    maxRetries: 3,
    onError: (error) => {
      console.error("[v0] RequestManager error:", error)
    },
    onRateLimit: (resetTime) => {
      console.log("[v0] Rate limited until:", resetTime)
      // Could show user notification here
    },
  })

  const {
    data: conversationData,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR(currentConversationId ? `/api/conversations/${currentConversationId}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onError: (error) => {
      console.error("[v0] Conversation fetch error:", error)
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

  useEffect(() => {
    if (currentConversationId && !user && currentConversationId.startsWith("guest-")) {
      const guestConversations = JSON.parse(localStorage.getItem("pelican_guest_conversations") || "[]")
      const exists = guestConversations.some((conv: any) => conv.id === currentConversationId)

      if (!exists) {
        console.log("[v0] Guest conversation not found in localStorage:", currentConversationId)
        setConversationNotFound(true)
      } else {
        // Load messages for guest conversation
        const savedMessages = loadGuestConversationMessages(currentConversationId)
        if (savedMessages.length > 0 && loadedConversationRef.current !== currentConversationId) {
          console.log(`[v0] Loading ${savedMessages.length} saved messages for guest conversation: ${currentConversationId}`)
          setMessages(savedMessages)
          loadedConversationRef.current = currentConversationId
        }
      }
    }
  }, [currentConversationId, user, loadGuestConversationMessages])

  useEffect(() => {
    if (conversationError && (conversationError.status === 404 || conversationError.status === 403)) {
      console.log("[v0] Conversation access denied or not found:", currentConversationId)
      setConversationNotFound(true)
      return
    }

    if (conversationData?.conversation?.messages && loadedConversationRef.current !== currentConversationId) {
      console.log(`[v0] Loading messages for conversation: ${currentConversationId}`)
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
      console.log("[v0] Clearing messages for new conversation")
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

      if (options.guestMode !== undefined) {
        setIsGuestMode(options.guestMode)
      }

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
        console.log("[v0] Sending message to Pelican API:", content)

        const guestUserId = localStorage.getItem(STORAGE_KEYS.GUEST_USER_ID)

        const response = await makeRequest(API_ENDPOINTS.CHAT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // If regenerating, user message is already in messagesRef, don't add it again
            messages: options.skipUserMessage ? messagesRef.current : [...messagesRef.current, userMessage],
            conversationId: currentConversationId,
            guestMode: options.guestMode || false,
            guestUserId: options.guestMode ? guestUserId : undefined,
            isFirstMessage: messagesRef.current.length === 0,
            fileIds: options.fileIds,
          }),
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (contentType?.includes("text/event-stream")) {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            throw new Error("No response body reader available")
          }

          let buffer = ""
          let streamingContent = ""

          while (true) {
            if (localAbortController.signal.aborted) {
              console.log("[v0] Stream cancelled by user")
              reader.cancel()
              break
            }

            const { done, value } = await reader.read()
            if (done) break

            if (localAbortController.signal.aborted) {
              console.log("[v0] Stream cancelled by user during processing")
              reader.cancel()
              return
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (localAbortController.signal.aborted) {
                console.log("[v0] Stream cancelled during line processing")
                reader.cancel()
                return
              }

              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  break
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.choices?.[0]?.delta?.content) {
                    streamingContent += parsed.choices[0].delta.content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id ? { ...msg, content: streamingContent, isStreaming: true } : msg,
                      ),
                    )
                  } else if (parsed.choices?.[0]?.finish_reason === "stop") {
                    if (parsed.conversationId && !currentConversationId) {
                      setCurrentConversationId(parsed.conversationId)
                      onConversationCreated?.(parsed.conversationId)
                      console.log("[v0] New conversation created:", parsed.conversationId)

                      if (options.guestMode && !user?.id) {
                        const title = content.length > LIMITS.TITLE_PREVIEW_LENGTH ? content.slice(0, LIMITS.TITLE_PREVIEW_LENGTH) + "..." : content
                        console.log("[v0] Saving guest conversation to localStorage:", parsed.conversationId)
                        ensureGuestConversation(parsed.conversationId, title)
                      }
                    }

                    const finalMessage = {
                      ...assistantMessage,
                      content: streamingContent || parsed.choices[0].message?.content || "No response received",
                      isStreaming: false,
                    }
                    setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? finalMessage : msg)))

                    if (options.guestMode && !user?.id && (currentConversationId || parsed.conversationId)) {
                      const conversationIdToUpdate = currentConversationId || parsed.conversationId
                      setMessages((currentMessages) => {
                        const finalMessages = currentMessages.map((msg) => (msg.id === assistantMessage.id ? finalMessage : msg))
                        const messageCount = finalMessages.length
                        const preview = content.slice(0, 100)
                        console.log("[v0] Updating guest conversation messages:", conversationIdToUpdate, messageCount)
                        updateGuestConversationMessages(conversationIdToUpdate, messageCount, preview, finalMessages)
                        return finalMessages
                      })
                    }

                    onFinish?.(finalMessage)
                  }
                } catch (parseError) {
                  console.error("[v0] Failed to parse streaming data:", parseError)
                }
              }
            }
          }

          if (localAbortController.signal.aborted) {
            setMessages((prev) =>
              streamingContent
                ? prev.map((msg) =>
                    msg.id === assistantMessage.id ? { ...msg, content: streamingContent, isStreaming: false } : msg,
                  )
                : prev.filter((msg) => msg.id !== assistantMessage.id), // Remove if no content
            )
          }
        } else {
          const data = await response.json()
          console.log("[v0] Received API response:", data)

          if (data.error) {
            throw new Error(data.error)
          }

          const reply = data.choices?.[0]?.message?.content || "No response received"

          if (data.conversationId && !currentConversationId) {
            setCurrentConversationId(data.conversationId)
            onConversationCreated?.(data.conversationId)
            console.log("[v0] New conversation created:", data.conversationId)

            if (options.guestMode && !user?.id) {
              const title = content.length > 50 ? content.slice(0, 50) + "..." : content
              console.log("[v0] Saving guest conversation to localStorage:", data.conversationId)
              ensureGuestConversation(data.conversationId, title)
            }
          }

          const finalMessage = { ...assistantMessage, content: reply, isStreaming: false }
          setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? finalMessage : msg)))

          if (options.guestMode && !user?.id && (currentConversationId || data.conversationId)) {
            const conversationIdToUpdate = currentConversationId || data.conversationId
            setMessages((currentMessages) => {
              const finalMessages = currentMessages.map((msg) => (msg.id === assistantMessage.id ? finalMessage : msg))
              const messageCount = finalMessages.length
              const preview = content.slice(0, 100)
              console.log("[v0] Updating guest conversation messages:", conversationIdToUpdate, messageCount)
              updateGuestConversationMessages(conversationIdToUpdate, messageCount, preview, finalMessages)
              return finalMessages
            })
          }

          onFinish?.(finalMessage)
        }

        if (currentConversationId) {
          mutateConversation()
        }
        mutate(API_ENDPOINTS.CONVERSATIONS)
      } catch (error) {
        logger.error("Chat error", error instanceof Error ? error : new Error(String(error)), {
          conversationId: currentConversationId,
          messageLength: content.length,
          isGuestMode: options.guestMode,
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
          const retryAction = () => {
            sendMessage(content, { ...options, skipUserMessage: true })
          }
          addSystemMessage("Request timed out. The server took too long to respond. Please try again.", retryAction)
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
      ensureGuestConversation,
      updateGuestConversationMessages,
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
      setTimeout(() => sendMessage(userMessage.content, { guestMode: isGuestMode, skipUserMessage: true }), 0)

      return newMessages
    })
  }, [sendMessage, isGuestMode])

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    clearMessages,
    removeMessage,
    regenerateLastMessage,
    conversationId: currentConversationId,
    isGuestMode,
    addSystemMessage,
    removeSystemMessage,
    conversationNotFound,
  }
}
