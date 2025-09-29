"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_preview: string
  user_id: string
  archived?: boolean
}

function generateGuestUUID(): string {
  // Generate a valid UUID v4 for guest users
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const GUEST_CONVERSATIONS_KEY = "pelican_guest_conversations"

function saveGuestConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(conversations))
  } catch (error) {
    console.error("Failed to save guest conversations:", error)
  }
}

function loadGuestConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(GUEST_CONVERSATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to load guest conversations:", error)
    return []
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [guestUserId, setGuestUserId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "archived" | "active">("active")

  const debouncedSearch = useDebounce(search, 300)

  const supabase = createClient()

  useEffect(() => {
    const storedGuestId = localStorage.getItem("pelican_guest_user_id")
    if (storedGuestId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(storedGuestId)) {
        setGuestUserId(storedGuestId)
      } else {
        // If stored ID is not a valid UUID, generate a new one
        const newGuestId = generateGuestUUID()
        localStorage.setItem("pelican_guest_user_id", newGuestId)
        setGuestUserId(newGuestId)
      }
    } else {
      const newGuestId = generateGuestUUID()
      localStorage.setItem("pelican_guest_user_id", newGuestId)
      setGuestUserId(newGuestId)
    }
  }, [])

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user?.id) {
        loadConversations(user.id)
      } else if (guestUserId) {
        const guestConversations = loadGuestConversations()
        setConversations(guestConversations)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    if (guestUserId) {
      getUser()
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)

      if (session?.user?.id) {
        loadConversations(session.user.id)
      } else if (guestUserId) {
        const guestConversations = loadGuestConversations()
        setConversations(guestConversations)
        setLoading(false)
      } else {
        setConversations([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [guestUserId])

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to real-time updates for authenticated users only
    const subscription = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${user.id}` },
        () => loadConversations(user.id),
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user])

  const loadConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error("Failed to load conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (title = "New Conversation") => {
    const effectiveUserId = user?.id || guestUserId
    if (!effectiveUserId) return null

    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: effectiveUserId,
            title,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("Failed to create conversation:", error)
        return null
      }
    } else {
      const newConversation: Conversation = {
        id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        last_message_preview: "",
        user_id: effectiveUserId,
        archived: false,
      }

      const currentConversations = loadGuestConversations()
      const updatedConversations = [newConversation, ...currentConversations]
      saveGuestConversations(updatedConversations)
      setConversations(updatedConversations)

      return newConversation
    }
  }

  const deleteConversation = async (conversationId: string) => {
    const effectiveUserId = user?.id || guestUserId
    if (!effectiveUserId) return false

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversationId)
          .eq("user_id", effectiveUserId)

        if (error) throw error
        return true
      } catch (error) {
        console.error("Failed to delete conversation:", error)
        return false
      }
    } else {
      const currentConversations = loadGuestConversations()
      const updatedConversations = currentConversations.filter((conv) => conv.id !== conversationId)
      saveGuestConversations(updatedConversations)
      setConversations(updatedConversations)

      // Clean up saved messages for deleted conversation
      const messagesKey = `pelican_guest_messages_${conversationId}`
      localStorage.removeItem(messagesKey)
      console.log(`[v0] Removed saved messages for deleted conversation ${conversationId}`)

      return true
    }
  }

  const updateConversation = async (conversationId: string, updates: { title?: string; archived?: boolean }) => {
    const effectiveUserId = user?.id || guestUserId
    if (!effectiveUserId) return false

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("conversations")
          .update(updates)
          .eq("id", conversationId)
          .eq("user_id", effectiveUserId)

        if (error) throw error
        return true
      } catch (error) {
        console.error("Failed to update conversation:", error)
        return false
      }
    } else {
      const currentConversations = loadGuestConversations()
      const updatedConversations = currentConversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates, updated_at: new Date().toISOString() } : conv,
      )
      saveGuestConversations(updatedConversations)
      setConversations(updatedConversations)
      return true
    }
  }

  const updateGuestConversationMessages = (
    conversationId: string,
    messageCount: number,
    lastMessagePreview: string,
    messages?: any[],
  ) => {
    if (user?.id) return // Only for guest users

    console.log(
      "[v0] updateGuestConversationMessages called:",
      conversationId,
      messageCount,
      lastMessagePreview.slice(0, 30),
    )

    const currentConversations = loadGuestConversations()
    const updatedConversations = currentConversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            message_count: messageCount,
            last_message_preview: lastMessagePreview,
            updated_at: new Date().toISOString(),
          }
        : conv,
    )

    console.log("[v0] Updated guest conversations:", updatedConversations.length)
    saveGuestConversations(updatedConversations)
    setConversations(updatedConversations)

    // Also save the actual messages for this conversation
    if (messages && messages.length > 0) {
      const messagesKey = `pelican_guest_messages_${conversationId}`
      const messagesToStore = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        attachments: msg.attachments,
      }))
      localStorage.setItem(messagesKey, JSON.stringify(messagesToStore))
      console.log(`[v0] Saved ${messages.length} messages for conversation ${conversationId}`)
    }
  }

  const loadGuestConversationMessages = (conversationId: string) => {
    if (user?.id) return [] // Only for guest users
    const messagesKey = `pelican_guest_messages_${conversationId}`
    const stored = localStorage.getItem(messagesKey)
    if (stored) {
      try {
        const messages = JSON.parse(stored)
        console.log(`[v0] Loaded ${messages.length} messages for conversation ${conversationId}`)
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          isStreaming: false,
        }))
      } catch (error) {
        console.error("[v0] Failed to load guest messages:", error)
      }
    }
    return []
  }

  const ensureGuestConversation = (conversationId: string, title?: string) => {
    if (user?.id) return // Only for guest users

    console.log("[v0] ensureGuestConversation called:", conversationId, title)

    const currentConversations = loadGuestConversations()
    const existingConversation = currentConversations.find((conv) => conv.id === conversationId)

    if (!existingConversation) {
      const newConversation: Conversation = {
        id: conversationId,
        title: title || "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        last_message_preview: "",
        user_id: guestUserId || "",
        archived: false,
      }

      const updatedConversations = [newConversation, ...currentConversations]
      console.log("[v0] Saving guest conversation to localStorage:", newConversation)
      saveGuestConversations(updatedConversations)
      setConversations(updatedConversations)
    } else {
      console.log("[v0] Guest conversation already exists:", conversationId)
    }
  }

  const rename = useCallback(
    async (conversationId: string, newTitle: string) => {
      const effectiveUserId = user?.id || guestUserId
      if (!effectiveUserId) return false

      // Optimistic update
      const previousConversations = conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
        ),
      )

      try {
        if (user?.id) {
          const { error } = await supabase
            .from("conversations")
            .update({ title: newTitle })
            .eq("id", conversationId)
            .eq("user_id", effectiveUserId)

          if (error) throw error
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
          )
          saveGuestConversations(updatedConversations)
        }
        return true
      } catch (error) {
        console.error("Failed to rename conversation:", error)
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
    },
    [conversations, user?.id, guestUserId, supabase],
  )

  const archive = useCallback(
    async (conversationId: string, archived = true) => {
      const effectiveUserId = user?.id || guestUserId
      if (!effectiveUserId) return false

      // Optimistic update
      const previousConversations = conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, archived, updated_at: new Date().toISOString() } : conv,
        ),
      )

      try {
        if (user?.id) {
          const { error } = await supabase
            .from("conversations")
            .update({ archived })
            .eq("id", conversationId)
            .eq("user_id", effectiveUserId)

          if (error) throw error
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, archived, updated_at: new Date().toISOString() } : conv,
          )
          saveGuestConversations(updatedConversations)
        }
        return true
      } catch (error) {
        console.error("Failed to archive conversation:", error)
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
    },
    [conversations, user?.id, guestUserId, supabase],
  )

  const remove = useCallback(
    async (conversationId: string) => {
      const effectiveUserId = user?.id || guestUserId
      if (!effectiveUserId) return false

      // Optimistic update
      const previousConversations = conversations
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

      try {
        if (user?.id) {
          const { error } = await supabase
            .from("conversations")
            .delete()
            .eq("id", conversationId)
            .eq("user_id", effectiveUserId)

          if (error) throw error
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.filter((conv) => conv.id !== conversationId)
          saveGuestConversations(updatedConversations)

          // Clean up saved messages for removed conversation
          const messagesKey = `pelican_guest_messages_${conversationId}`
          localStorage.removeItem(messagesKey)
          console.log(`[v0] Removed saved messages for removed conversation ${conversationId}`)
        }
        return true
      } catch (error) {
        console.error("Failed to remove conversation:", error)
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
    },
    [conversations, user?.id, guestUserId, supabase],
  )

  const list = useMemo(() => {
    let filtered = conversations

    // Apply filter
    if (filter === "archived") {
      filtered = filtered.filter((conv) => conv.archived)
    } else if (filter === "active") {
      filtered = filtered.filter((conv) => !conv.archived)
    }

    // Apply search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchLower) ||
          conv.last_message_preview.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [conversations, filter, debouncedSearch])

  return {
    list,
    loading,
    filter,
    setFilter,
    search,
    setSearch,
    rename,
    archive,
    remove,
    // Legacy functions for backward compatibility
    conversations,
    isLoading: loading,
    user,
    guestUserId,
    effectiveUserId: user?.id || guestUserId,
    createConversation,
    deleteConversation,
    updateConversation,
    updateGuestConversationMessages,
    ensureGuestConversation,
    loadGuestConversationMessages,
  }
}
