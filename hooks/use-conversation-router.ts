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
  const { conversations } = useConversations()

  // SINGLE SOURCE OF TRUTH: Derive conversation ID from URL
  const currentConversationId = searchParams.get("conversation")
  
  const bootstrappedRef = useRef(false)
  const previousConversationIdRef = useRef<string | null>(null)

  // Bootstrap: Select most recent conversation when no URL param
  // Do NOT create a new conversation - let that happen on first message
  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid) return // Already has conversation in URL, do nothing
    if (bootstrappedRef.current) return
    if (!user) return // Wait for user to be authenticated
    
    bootstrappedRef.current = true
    
    // If user has existing non-archived conversations, select the most recent one
    // If no conversations exist, stay at /chat with no param (truly new conversation)
    if (conversations.length > 0) {
      const mostRecent = conversations
        .filter((c) => !c.archived)
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() - 
            new Date(a.updated_at || a.created_at).getTime()
        )[0]
      
      if (mostRecent?.id) {
        router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(mostRecent.id)}`, { scroll: false })
      }
      // If all conversations are archived or list is empty after filter, stay at /chat
    }
    // Do NOT call create() here - backend creates conversation on first message
  }, [searchParams, user, router, conversations])

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
