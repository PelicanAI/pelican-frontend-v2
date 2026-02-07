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
  // FIX: Also get loading state to prevent race condition
  const { conversations, loading: conversationsLoading } = useConversations()

  // SINGLE SOURCE OF TRUTH: Derive conversation ID from URL
  const currentConversationId = searchParams.get("conversation")
  
  const bootstrappedRef = useRef(false)
  const previousConversationIdRef = useRef<string | null>(null)

  // FIX: Reset bootstrap ref when user logs out
  // This ensures bootstrap runs again on next login
  useEffect(() => {
    if (!user) {
      bootstrappedRef.current = false
    }
  }, [user])

  // Bootstrap: Mark as ready once user and conversations are loaded.
  // No conversation param in the URL = fresh new chat (welcome screen).
  // Users select previous conversations from the sidebar.
  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid) return // Already has conversation in URL
    if (bootstrappedRef.current) return
    if (!user) return
    if (conversationsLoading) return

    bootstrappedRef.current = true

    logger.info("[ROUTER] Bootstrap: landing on new chat", {
      conversationCount: conversations.length,
    })
  }, [searchParams, user, conversations, conversationsLoading])

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
    
    if (chatLoading) {
      stopGeneration()
    }
    
    // Clear messages in the UI
    clearMessages()
    
    // Navigate to clean URL with no conversation param
    // The backend will create the conversation when the first message is sent
    // and return the conversation ID, which triggers onConversationCreated
    startTransition(() => {
      router.replace(ROUTES.CHAT, { scroll: false })
    })
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
