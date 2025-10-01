"use client"

import { useState, useEffect, useRef, startTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useConversations } from "./use-conversations"
import { STORAGE_KEYS, ROUTES, LIMITS } from "@/lib/constants"

interface UseConversationRouterOptions {
  user: any
  guestMode: boolean
  chatLoading: boolean
  messages: any[]
  stopGeneration: () => void
  clearMessages: () => void
  updateConversation: (id: string, updates: any) => Promise<boolean>
  clearDraftForConversation?: (id: string) => void
}

export function useConversationRouter({
  user,
  guestMode,
  chatLoading,
  messages,
  stopGeneration,
  clearMessages,
  updateConversation,
  clearDraftForConversation,
}: UseConversationRouterOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createConversation, conversations } = useConversations()

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid) return
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    ;(async () => {
      let latestId: string | null = null

      if (user && !guestMode) {
        if (conversations.length > 0) {
          const mostRecent = conversations
            .filter((c) => !c.archived)
            .sort(
              (a, b) =>
                new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
            )[0]
          latestId = mostRecent?.id || null
        }
      } else {
        latestId = localStorage.getItem(STORAGE_KEYS.LAST_CONVERSATION)
      }

      const id = latestId || (await createConversation("New Chat")).id
      router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
    })()
  }, [searchParams, user, guestMode, conversations, createConversation, router])

  useEffect(() => {
    const cid = searchParams.get("conversation")
    if (cid && cid !== currentConversationId) {
      setCurrentConversationId(cid)
    }
  }, [searchParams, currentConversationId])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LAST_CONVERSATION && e.newValue) {
        const conversationInUrl = searchParams.get("conversation")

        if (!conversationInUrl && e.newValue !== currentConversationId) {
          setCurrentConversationId(e.newValue)
          router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(e.newValue)}`, { scroll: false })
        }
      }
    }

    if (guestMode) {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [guestMode, searchParams, currentConversationId, router])

  useEffect(() => {
    if (currentConversationId) {
      if (guestMode) {
        localStorage.setItem(STORAGE_KEYS.LAST_CONVERSATION, currentConversationId)
      }
    }
  }, [currentConversationId, guestMode, user])

  const handleConversationSelect = (id: string) => {
    const current = searchParams.get("conversation")
    if (current === id && currentConversationId === id) return

    if (chatLoading) {
      stopGeneration()
    }

    if (clearDraftForConversation && currentConversationId) {
      clearDraftForConversation(currentConversationId)
    }
    setCurrentConversationId(id)

    startTransition(() => {
      router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}&_r=${Date.now()}`, { scroll: false })
    })
  }

  const handleNewConversation = async () => {
    // Archive current conversation if it has messages
    if (messages.length > 0 && currentConversationId) {

      if (guestMode && currentConversationId.startsWith("guest-")) {
        await updateConversation(currentConversationId, {
          title: messages[0]?.content?.slice(0, LIMITS.TITLE_PREVIEW_LENGTH) + "..." || "Untitled Chat",
          archived: true,
        })
      } else if (!guestMode) {
        try {
          await fetch(`/api/conversations/${currentConversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: messages[0]?.content?.slice(0, LIMITS.TITLE_PREVIEW_LENGTH) + "..." || "Untitled Chat",
              archived: true,
              updated_at: new Date().toISOString(),
            }),
          })
        } catch (error) {
          console.error("[v0] Failed to update conversation before new chat:", error)
        }
      }
    }

    // Clear current state
    setCurrentConversationId(null)
    clearMessages()
    
    // Create new conversation and navigate to it directly
    const newConversation = await createConversation("New Chat")
    
    startTransition(() => {
      router.push(`${ROUTES.CHAT}?conversation=${encodeURIComponent(newConversation.id)}`, { scroll: false })
    })
  }

  return {
    currentConversationId,
    setCurrentConversationId,
    handleConversationSelect,
    handleNewConversation,
  }
}