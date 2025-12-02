"use client"

import { useEffect, useRef, startTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useConversations } from "./use-conversations"
import { ROUTES, LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"

interface UseConversationRouterOptions {
  user: any
  chatLoading: boolean
  messages: any[]
  stopGeneration: () => void
  clearMessages: () => void
  clearDraftForConversation?: (id: string) => void
}

export function useConversationRouter({
  user,
  chatLoading,
  messages,
  stopGeneration,
  clearMessages,
  clearDraftForConversation,
}: UseConversationRouterOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { create, conversations } = useConversations()

  // SINGLE SOURCE OF TRUTH: Derive conversation ID from URL
  const currentConversationId = searchParams.get("conversation")
  
  const bootstrappedRef = useRef(false)
  const isCreatingNewRef = useRef(false)
  const previousConversationIdRef = useRef<string | null>(null)

  // Bootstrap: Create or select initial conversation when no URL param
  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid) return
    if (bootstrappedRef.current) return
    if (!user) return // Wait for user to be authenticated
    
    bootstrappedRef.current = true
    
    ;(async () => {
      let latestId: string | null = null

      if (conversations.length > 0) {
        const mostRecent = conversations
          .filter((c) => !c.archived)
          .sort(
            (a, b) =>
              new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
          )[0]
        latestId = mostRecent?.id || null
      }

      const id = latestId || (await create("New Chat"))?.id
      if (id) {
        router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
      }
    })()
  }, [searchParams, user, create, router, conversations])

  // Track conversation changes for cleanup (clear drafts for previous conversation)
  useEffect(() => {
    const cid = searchParams.get("conversation")
    
    if (previousConversationIdRef.current && previousConversationIdRef.current !== cid) {
      // Conversation changed - clear draft for old conversation
      if (clearDraftForConversation) {
        clearDraftForConversation(previousConversationIdRef.current)
      }
    }
    
    previousConversationIdRef.current = cid
  }, [searchParams, clearDraftForConversation])

  const handleConversationSelect = (id: string) => {
    const current = searchParams.get("conversation")
    if (current === id) return

    if (chatLoading) {
      stopGeneration()
    }

    logger.info("[ROUTER] Selecting conversation", { id, from: current })

    startTransition(() => {
      router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
    })
  }

  const handleNewConversation = async () => {
    logger.info("[New Chat] Button clicked")
    
    // Debounce: Prevent multiple rapid clicks from creating multiple conversations
    if (isCreatingNewRef.current) {
      logger.info("[New Chat] Already creating, ignoring click")
      return
    }
    
    isCreatingNewRef.current = true
    
    try {
      if (chatLoading) {
        stopGeneration()
      }

      const newConversation = await create("New Chat")
      
      if (!newConversation) {
        logger.error("[New Chat] Failed to create conversation")
        return
      }
      
      logger.info("[New Chat] Created", { id: newConversation.id })

      const oldConversationId = currentConversationId
      const oldMessages = [...messages]
      
      startTransition(() => {
        router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(newConversation.id)}`, { scroll: false })
      })
      
      // Archive old conversation after navigation (if it had messages)
      setTimeout(() => {
        if (oldMessages.length > 0 && oldConversationId) {
          fetch(`/api/conversations/${oldConversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: oldMessages[0]?.content?.slice(0, LIMITS.TITLE_PREVIEW_LENGTH) + "..." || "Untitled Chat",
              archived: true,
              updated_at: new Date().toISOString(),
            }),
          }).catch(error => logger.error("Failed to archive conversation", error instanceof Error ? error : new Error(String(error)), { conversationId: oldConversationId }))
        }
      }, 100)
      
    } finally {
      // Reset debounce flag after delay
      setTimeout(() => {
        isCreatingNewRef.current = false
      }, 1000)
    }
  }

  // setCurrentConversationId: Navigate to conversation (for backwards compatibility)
  // The URL is the source of truth, so this just triggers navigation
  const setCurrentConversationId = (id: string | null) => {
    if (id && id !== currentConversationId) {
      startTransition(() => {
        router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
      })
    }
  }

  return {
    currentConversationId,
    setCurrentConversationId,
    handleConversationSelect,
    handleNewConversation,
  }
}
