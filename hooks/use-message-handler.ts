"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatInputRef } from "@/components/chat/chat-input"

interface UseMessageHandlerOptions {
  chatLoading: boolean
  currentConversationId: string | null
  sendMessage: (content: string, options?: { attachments?: any[]; fileIds?: string[] }) => Promise<void>
  chatInputRef: React.RefObject<ChatInputRef>
}

export function useMessageHandler({
  chatLoading,
  currentConversationId,
  sendMessage,
  chatInputRef,
}: UseMessageHandlerOptions) {
  const [isDraftWhileStreaming, setIsDraftWhileStreaming] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)
  const [draftConversationId, setDraftConversationId] = useState<string | null>(null)
  const [isTypingDuringResponse, setIsTypingDuringResponse] = useState(false)
  const [isQueueingMessage, setIsQueueingMessage] = useState(false)

  const setDraftConversationIdSafe = useCallback((conversationId: string | null) => {
    setDraftConversationId(conversationId)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string, options?: { forceQueue?: boolean }) => {
      if (chatLoading || options?.forceQueue) {
        setPendingDraft(content)
        setDraftConversationId(currentConversationId)
        setIsQueueingMessage(true)
        return
      }

      await sendMessage(content)
      setTimeout(() => {
        chatInputRef.current?.focus()
      }, 100)
    },
    [chatLoading, currentConversationId, sendMessage, chatInputRef],
  )

  const handleTypingDuringResponse = useCallback(() => {
    if (chatLoading && !isDraftWhileStreaming) {
      setIsDraftWhileStreaming(true)
      setIsTypingDuringResponse(true)
      setDraftConversationId(currentConversationId)
    }
  }, [chatLoading, isDraftWhileStreaming, currentConversationId])

  const handleForceQueue = useCallback(
    (content: string) => {
      handleSendMessage(content, { forceQueue: true })
    },
    [handleSendMessage],
  )

  const handleMessageFinish = useCallback(async () => {
    setIsDraftWhileStreaming(false)
    setIsTypingDuringResponse(false)

    if (pendingDraft) {
      const draftToSend = pendingDraft
      setPendingDraft(null)
      setTimeout(async () => {
        await sendMessage(draftToSend)
        chatInputRef.current?.focus()
      }, 100)
    }
  }, [pendingDraft, sendMessage, chatInputRef])

  const clearDraftForConversation = useCallback(
    (conversationId: string) => {
      if (draftConversationId !== conversationId) {
        setPendingDraft(null)
        setDraftConversationId(null)
        setIsDraftWhileStreaming(false)
        setIsQueueingMessage(false)
      }
    },
    [draftConversationId],
  )

  const resetDraftState = useCallback(() => {
    setIsDraftWhileStreaming(false)
    setIsTypingDuringResponse(false)
    setIsQueueingMessage(false)
  }, [])

  return {
    handleSendMessage,
    handleTypingDuringResponse,
    handleForceQueue,
    handleMessageFinish,
    clearDraftForConversation,
    resetDraftState,
    pendingDraft,
    isDraftWhileStreaming,
    isTypingDuringResponse,
    isQueueingMessage,
    draftConversationId,
    setDraftConversationId: setDraftConversationIdSafe,
  }
}