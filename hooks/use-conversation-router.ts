"use client"

import { useState, useEffect, useRef, startTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useConversations } from "./use-conversations"
import { STORAGE_KEYS, ROUTES, LIMITS } from "@/lib/constants"
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

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const bootstrappedRef = useRef(false)
  const isCreatingNewRef = useRef(false)

  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid) return
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    ;(async () => {
      let latestId: string | null = null

      if (user) {
        if (conversations.length > 0) {
          const mostRecent = conversations
            .filter((c) => !c.archived)
            .sort(
              (a, b) =>
                new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
            )[0]
          latestId = mostRecent?.id || null
        }
      }

      const id = latestId || (await create("New Chat"))?.id
      if (id) {
        router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, create, router])
  // Note: conversations is intentionally excluded from dependencies to prevent
  // race conditions during navigation. The bootstrap only runs once when there's
  // no conversation in the URL, and conversations is captured in the closure.

  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid && cid !== currentConversationId) {
      setCurrentConversationId(cid)
    }
  }, [searchParams, currentConversationId])

  // Storage change listener removed - no longer needed without guest mode
  // Last conversation tracking removed - no longer needed without guest mode

  const handleConversationSelect = (id: string) => {
    const current = searchParams.get("conversation")
    if (current === id && currentConversationId === id) return

    if (chatLoading) {
      stopGeneration()
    }

    if (clearDraftForConversation && currentConversationId) {
      clearDraftForConversation(currentConversationId)
    }
    
    // REMOVED: setCurrentConversationId(id) 
    // Let the URL-sync useEffect handle this instead (lines 63-68)
    // This prevents race conditions where state updates before URL navigation completes

    startTransition(() => {
      router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}&_r=${Date.now()}`, { scroll: false })
    })
  }

  const handleNewConversation = async () => {
    console.log("🔵 [New Chat] Button clicked")
    
    // ⚡ DEBOUNCE FIX: Prevent multiple rapid clicks from creating multiple conversations
    // This is CRITICAL - without this, double-clicks create two conversations
    if (isCreatingNewRef.current) {
      console.log("🔵 [New Chat] Already creating, ignoring click")
      return
    }
    
    isCreatingNewRef.current = true
    
    try {
      // Stop any ongoing generation first
      if (chatLoading) {
        console.log("🔵 [New Chat] Stopping ongoing generation")
        stopGeneration()
      }

      console.log("🔵 [New Chat] Creating new conversation...")
      // Create new conversation FIRST (before any state changes)
      const newConversation = await create("New Chat")
      
      if (!newConversation) {
        console.error("🔴 [New Chat] Failed to create conversation")
        isCreatingNewRef.current = false // Reset flag on error
        return
      }
      
      console.log("🔵 [New Chat] Created:", newConversation.id)

      // Store the old conversation ID for archiving AFTER navigation
      const oldConversationId = currentConversationId
      const oldMessages = [...messages]
      
      // Navigate immediately to new conversation
      const newUrl = `${ROUTES.CHAT}?conversation=${encodeURIComponent(newConversation.id)}&_r=${Date.now()}`
      console.log("🔵 [New Chat] Navigating to:", newUrl)
      
      startTransition(() => {
        router.push(newUrl, { scroll: false })
      })
      
      console.log("🔵 [New Chat] Navigation initiated")
      
      // Archive old conversation AFTER navigation (if it had messages)
      // Use setTimeout to ensure this happens after the navigation starts
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

        // Clear draft for old conversation
        if (clearDraftForConversation && oldConversationId) {
          clearDraftForConversation(oldConversationId)
        }
      }, 100)
      
    } finally {
      // Reset the flag after a short delay (1 second) to prevent double-clicks from creating multiple chats
      // This is longer than before to ensure the navigation fully completes
      setTimeout(() => {
        isCreatingNewRef.current = false
      }, 1000)
    }
  }

  return {
    currentConversationId,
    setCurrentConversationId,
    handleConversationSelect,
    handleNewConversation,
  }
}