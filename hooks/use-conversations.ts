"use client"

/**
 * Conversations Hook
 * 
 * Manages conversation state for both authenticated and guest users.
 * Uses RLS-safe operations for all database interactions.
 * 
 * @version 3.0.0 - Streamlined (removed legacy duplicates)
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import * as Sentry from "@sentry/nextjs"
import { captureError } from "@/lib/sentry-helper"
import {
  isValidUUID,
  updateConversation as updateConversationDB,
  hardDeleteConversation,
  logRLSError
} from "@/lib/supabase/helpers"

// ============================================================================
// Types
// ============================================================================

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_preview: string
  user_id: string
  archived?: boolean
}

export interface UseConversationsReturn {
  // State
  conversations: Conversation[]
  loading: boolean
  user: User | null
  guestUserId: string | null
  effectiveUserId: string | null
  
  // Filters
  filter: "all" | "archived" | "active"
  setFilter: (filter: "all" | "archived" | "active") => void
  search: string
  setSearch: (search: string) => void
  
  // Filtered list
  list: Conversation[]
  
  // Operations
  create: (title?: string) => Promise<Conversation | null>
  rename: (id: string, title: string) => Promise<boolean>
  archive: (id: string, archived?: boolean) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  
  // Guest-specific
  updateGuestMessages: (id: string, count: number, preview: string, messages?: unknown[]) => void
  loadGuestMessages: (id: string) => unknown[]
  ensureGuestConversation: (id: string, title?: string) => void
}

// ============================================================================
// Guest User Utilities
// ============================================================================

function generateGuestUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const GUEST_CONVERSATIONS_KEY = "pelican_guest_conversations"
const GUEST_USER_ID_KEY = "pelican_guest_user_id"

function saveGuestConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(conversations))
  } catch (error) {
    console.error("[Conversations] Failed to save guest conversations:", error)
  }
}

function loadGuestConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(GUEST_CONVERSATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[Conversations] Failed to load guest conversations:", error)
    return []
  }
}

// ============================================================================
// Debounce Hook
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// Main Hook
// ============================================================================

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [guestUserId, setGuestUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "archived" | "active">("active")
  const [search, setSearch] = useState("")

  const debouncedSearch = useDebounce(search, 300)
  const pathname = usePathname()
  const supabase = createClient()
  const effectiveUserId = user?.id || guestUserId

  // --------------------------------------------------------------------------
  // Debug: Log user ID sources
  // --------------------------------------------------------------------------
  useEffect(() => {
    console.log('[USER-ID-DEBUG] User ID sources:', {
      'userState.id': user?.id || null,
      'userState.email': user?.email || null,
      guestUserId,
      effectiveUserId,
      pathname,
      timestamp: new Date().toISOString()
    });

    // Check what supabase.auth.getUser() returns
    supabase.auth.getUser().then(({ data: { user: currentUser }, error }) => {
      console.log('[USER-ID-DEBUG] supabase.auth.getUser() returns:', {
        'supabaseUser.id': currentUser?.id || null,
        'supabaseUser.email': currentUser?.email || null,
        'hookUser.id': user?.id || null,
        'hookUser.email': user?.email || null,
        'usersMatch': currentUser?.id === user?.id,
        error,
        timestamp: new Date().toISOString()
      });

      // Warn if there's a mismatch
      if (currentUser?.id && user?.id && currentUser.id !== user.id) {
        console.error('[USER-ID-DEBUG] ⚠️ MISMATCH DETECTED!', {
          'supabase.auth.getUser()': currentUser.id,
          'hook user state': user.id,
          'difference': 'Hook has stale user ID!'
        });
      }

      // Warn if guestUserId is being used for authenticated user
      if (currentUser?.id && guestUserId && effectiveUserId === guestUserId) {
        console.error('[USER-ID-DEBUG] ⚠️ GUEST USER ID FALLBACK!', {
          'authenticatedUser.id': currentUser.id,
          'guestUserId': guestUserId,
          'effectiveUserId': effectiveUserId,
          'problem': 'Using guestUserId instead of authenticated user ID!'
        });
      }
    });
  }, [user, guestUserId, effectiveUserId, pathname, supabase])

  // --------------------------------------------------------------------------
  // Load from database
  // --------------------------------------------------------------------------
  const loadFromDatabase = useCallback(async (userId: string) => {
    // Get fresh auth state to compare
    const { data: { user: freshUser } } = await supabase.auth.getUser()
    
    console.log('[CONVERSATIONS-DEBUG] loadFromDatabase called', {
      'passedUserId': userId,
      'hookUserState.id': user?.id || null,
      'freshSupabaseUser.id': freshUser?.id || null,
      'guestUserId': guestUserId,
      'effectiveUserId': effectiveUserId,
      'usingGuestId': userId === guestUserId && !freshUser?.id,
      'userIdsMatch': userId === freshUser?.id,
      'hookStateMatchesFresh': user?.id === freshUser?.id,
      timestamp: new Date().toISOString()
    });

    // Warn if wrong user ID is being used
    if (freshUser?.id && userId !== freshUser.id) {
      console.error('[CONVERSATIONS-DEBUG] ⚠️ WRONG USER ID BEING QUERIED!', {
        'expectedUserId': freshUser.id,
        'actualUserId': userId,
        'hookUserState.id': user?.id,
        'problem': `Querying conversations for user ${userId} but authenticated user is ${freshUser.id}`
      });
    }
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1000)
      
      console.log('[CONVERSATIONS-DEBUG] Supabase response:', {
        'queriedUserId': userId,
        'freshSupabaseUser.id': freshUser?.id || null,
        dataCount: data?.length || 0,
        error,
        conversations: data?.slice(0, 5).map(c => ({
          id: c.id,
          title: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at,
          user_id: c.user_id
        }))
      });
      
      if (error) throw error
      
      setConversations(data || [])
    } catch (error) {
      console.error("[Conversations] Load failed:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [supabase, user, guestUserId, effectiveUserId])

  // --------------------------------------------------------------------------
  // Initialize guest user ID
  // --------------------------------------------------------------------------
  useEffect(() => {
    const storedGuestId = localStorage.getItem(GUEST_USER_ID_KEY)
    
    console.log('[USER-ID-DEBUG] Initializing guest user ID:', {
      'storedGuestId': storedGuestId,
      'isValidUUID': storedGuestId ? isValidUUID(storedGuestId) : false,
      'willGenerateNew': !storedGuestId || !isValidUUID(storedGuestId),
      timestamp: new Date().toISOString()
    });
    
    if (storedGuestId && isValidUUID(storedGuestId)) {
      console.log('[USER-ID-DEBUG] Using stored guest user ID:', storedGuestId);
      setGuestUserId(storedGuestId)
      
      // Warn if stored guest ID looks like a real user ID (UUID v4 pattern)
      if (storedGuestId === '6f182e43-0a80-4636-b147-90e2ff81e4a6') {
        console.error('[USER-ID-DEBUG] ⚠️ SUSPICIOUS: Stored guest ID matches reported problematic ID!', {
          storedGuestId,
          'warning': 'This might be a real user ID stored as guest ID!'
        });
      }
    } else {
      const newGuestId = generateGuestUUID()
      console.log('[USER-ID-DEBUG] Generating new guest user ID:', newGuestId);
      localStorage.setItem(GUEST_USER_ID_KEY, newGuestId)
      setGuestUserId(newGuestId)
    }
  }, [])

  // --------------------------------------------------------------------------
  // Auth state management
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!guestUserId) return

    let cancelled = false
    let subscription: { unsubscribe: () => void } | null = null

    const init = async () => {
      const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser()
      if (cancelled) return

      console.log('[USER-ID-DEBUG] init() - supabase.auth.getUser() result:', {
        'fetchedUser.id': fetchedUser?.id || null,
        'fetchedUser.email': fetchedUser?.email || null,
        'currentHookUser.id': user?.id || null,
        'guestUserId': guestUserId,
        authError,
        timestamp: new Date().toISOString()
      });

      setUser(fetchedUser)
      
      if (fetchedUser?.id) {
        console.log('[USER-ID-DEBUG] init() - Loading conversations for authenticated user:', fetchedUser.id);
        await loadFromDatabase(fetchedUser.id)
      } else {
        console.log('[USER-ID-DEBUG] init() - No authenticated user, loading guest conversations');
        setConversations(loadGuestConversations())
        setLoading(false)
      }
    }

    const setupListener = () => {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return

        console.log('[USER-ID-DEBUG] onAuthStateChange event:', {
          event,
          'sessionUser.id': session?.user?.id || null,
          'sessionUser.email': session?.user?.email || null,
          'previousHookUser.id': user?.id || null,
          'guestUserId': guestUserId,
          timestamp: new Date().toISOString()
        });

        setUser(session?.user || null)

        if (session?.user?.id) {
          console.log('[USER-ID-DEBUG] Auth change - Loading conversations for:', session.user.id);
          loadFromDatabase(session.user.id)
        } else {
          console.log('[USER-ID-DEBUG] Auth change - No user, loading guest conversations');
          setConversations(loadGuestConversations())
          setLoading(false)
        }
      })
      subscription = data.subscription
    }

    init()
    setupListener()

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [guestUserId, loadFromDatabase, supabase])

  // --------------------------------------------------------------------------
  // Real-time subscription
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "conversations", 
          filter: `user_id=eq.${user.id}` 
        },
        () => loadFromDatabase(user.id)
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [user?.id, loadFromDatabase])

  // --------------------------------------------------------------------------
  // Refetch on route change to /chat
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Refetch conversations when navigating to /chat
    if (pathname === '/chat') {
      // Get fresh auth state instead of relying on potentially stale user state
      supabase.auth.getUser().then(({ data: { user: freshUser } }) => {
        console.log('[USER-ID-DEBUG] Pathname changed to /chat:', {
          pathname,
          'hookUserState.id': user?.id || null,
          'freshSupabaseUser.id': freshUser?.id || null,
          'guestUserId': guestUserId,
          'effectiveUserId': effectiveUserId,
          'willLoadWith': freshUser?.id || guestUserId,
          timestamp: new Date().toISOString()
        });

        if (freshUser?.id) {
          console.log('[USER-ID-DEBUG] Pathname /chat - Using fresh user ID:', freshUser.id);
          loadFromDatabase(freshUser.id)
        } else if (user?.id) {
          console.log('[USER-ID-DEBUG] Pathname /chat - Using hook user state ID:', user.id);
          loadFromDatabase(user.id)
        } else {
          console.log('[USER-ID-DEBUG] Pathname /chat - No user, loading guest conversations');
          setConversations(loadGuestConversations())
          setLoading(false)
        }
      })
    }
  }, [pathname, user?.id, loadFromDatabase, supabase, guestUserId, effectiveUserId])

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------
  const create = useCallback(async (title = "New Conversation"): Promise<Conversation | null> => {
    // Get fresh auth state
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      Sentry.captureException(authError, { tags: { action: "create_conversation" } })
    }

    const userId = currentUser?.id || guestUserId
    if (!userId) {
      console.error("[Conversations] No user ID for create")
      return null
    }

    // Authenticated user: save to database
    if (currentUser?.id) {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title })
          .select()
          .single()

        if (error || !data) {
          console.error("[Conversations] Create failed:", error)
          throw error || new Error("No data returned")
        }

        await loadFromDatabase(currentUser.id)
        if (!user) setUser(currentUser)
        
        return data
      } catch (error) {
        Sentry.captureException(error, { 
          tags: { action: "create_conversation" },
          extra: { userId, title }
        })
        return null
      }
    }

    // Guest user: save to localStorage
    const newConversation: Conversation = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      last_message_preview: "",
      user_id: userId,
      archived: false,
    }

    const updated = [newConversation, ...loadGuestConversations()]
    saveGuestConversations(updated)
    setConversations(updated)

    return newConversation
  }, [guestUserId, user, supabase, loadFromDatabase])

  // --------------------------------------------------------------------------
  // RENAME
  // --------------------------------------------------------------------------
  const rename = useCallback(async (conversationId: string, newTitle: string): Promise<boolean> => {
    if (!effectiveUserId) return false

    // Optimistic update
    const previous = conversations
    setConversations(prev => 
      prev.map(c => c.id === conversationId 
        ? { ...c, title: newTitle, updated_at: new Date().toISOString() } 
        : c
      )
    )

    try {
      if (user?.id) {
        // Use API route for consistency with other clients
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Rename failed")
        }
      } else {
        // Guest: update localStorage
        const updated = loadGuestConversations().map(c =>
          c.id === conversationId
            ? { ...c, title: newTitle, updated_at: new Date().toISOString() }
            : c
        )
        saveGuestConversations(updated)
      }
      return true
    } catch (error) {
      captureError(error, { action: "rename_conversation", conversationId })
      setConversations(previous) // Rollback
      return false
    }
  }, [conversations, effectiveUserId, user?.id])

  // --------------------------------------------------------------------------
  // ARCHIVE
  // --------------------------------------------------------------------------
  const archive = useCallback(async (conversationId: string, archived = true): Promise<boolean> => {
    if (!effectiveUserId) return false

    // Optimistic update
    const previous = conversations
    setConversations(prev =>
      prev.map(c => c.id === conversationId
        ? { ...c, archived, updated_at: new Date().toISOString() }
        : c
      )
    )

    try {
      if (user?.id) {
        const { success, error } = await updateConversationDB(
          supabase,
          conversationId,
          effectiveUserId,
          { archived, archived_at: archived ? new Date().toISOString() : null }
        )

        if (!success || error) {
          logRLSError("update", "conversations", error, { conversationId, archived })
          throw error || new Error("Archive failed")
        }
      } else {
        // Guest: update localStorage
        const updated = loadGuestConversations().map(c =>
          c.id === conversationId
            ? { ...c, archived, updated_at: new Date().toISOString() }
            : c
        )
        saveGuestConversations(updated)
      }
      return true
    } catch (error) {
      console.error("[Conversations] Archive failed:", error)
      setConversations(previous) // Rollback
      return false
    }
  }, [conversations, effectiveUserId, user?.id, supabase])

  // --------------------------------------------------------------------------
  // REMOVE (hard delete)
  // --------------------------------------------------------------------------
  const remove = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!effectiveUserId) return false

    // Optimistic update
    const previous = conversations
    setConversations(prev => prev.filter(c => c.id !== conversationId))

    try {
      if (user?.id) {
        const { deleted, error } = await hardDeleteConversation(
          supabase,
          conversationId,
          effectiveUserId
        )

        if (!deleted || error) {
          logRLSError("delete", "conversations", error, { conversationId })
          throw error || new Error("Delete failed")
        }
      } else {
        // Guest: update localStorage and clean up messages
        const updated = loadGuestConversations().filter(c => c.id !== conversationId)
        saveGuestConversations(updated)
        localStorage.removeItem(`pelican_guest_messages_${conversationId}`)
      }
      return true
    } catch (error) {
      console.error("[Conversations] Remove failed:", error)
      setConversations(previous) // Rollback
      return false
    }
  }, [conversations, effectiveUserId, user?.id, supabase])

  // --------------------------------------------------------------------------
  // Guest-specific utilities
  // --------------------------------------------------------------------------
  const updateGuestMessages = useCallback((
    conversationId: string,
    messageCount: number,
    lastMessagePreview: string,
    messages?: unknown[]
  ) => {
    if (user?.id) return // Auth users don't use this

    const updated = loadGuestConversations().map(c =>
      c.id === conversationId
        ? { ...c, message_count: messageCount, last_message_preview: lastMessagePreview, updated_at: new Date().toISOString() }
        : c
    )
    saveGuestConversations(updated)
    setConversations(updated)

    if (messages?.length) {
      const toStore = messages.map((m: unknown) => {
        const msg = m as { id: string; role: string; content: string; timestamp: unknown; attachments?: unknown }
        return { id: msg.id, role: msg.role, content: msg.content, timestamp: msg.timestamp, attachments: msg.attachments }
      })
      localStorage.setItem(`pelican_guest_messages_${conversationId}`, JSON.stringify(toStore))
    }
  }, [user?.id])

  const loadGuestMessages = useCallback((conversationId: string): unknown[] => {
    if (user?.id) return []
    
    try {
      const stored = localStorage.getItem(`pelican_guest_messages_${conversationId}`)
      if (!stored) return []
      
      return JSON.parse(stored).map((m: { timestamp: string }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        isStreaming: false,
      }))
    } catch {
      return []
    }
  }, [user?.id])

  const ensureGuestConversation = useCallback((conversationId: string, title?: string) => {
    if (user?.id) return

    const existing = loadGuestConversations()
    if (existing.some(c => c.id === conversationId)) return

    const newConv: Conversation = {
      id: conversationId,
      title: title || "New Conversation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      last_message_preview: "",
      user_id: guestUserId || "",
      archived: false,
    }

    const updated = [newConv, ...existing]
    saveGuestConversations(updated)
    setConversations(updated)
  }, [user?.id, guestUserId])

  // --------------------------------------------------------------------------
  // Filtered list
  // --------------------------------------------------------------------------
  const list = useMemo(() => {
    let result = conversations

    // Filter by archived status
    if (filter === "archived") {
      result = result.filter(c => c.archived)
    } else if (filter === "active") {
      result = result.filter(c => !c.archived)
    }

    // Filter by search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.last_message_preview.toLowerCase().includes(q)
      )
    }

    return result
  }, [conversations, filter, debouncedSearch])

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------
  return {
    conversations,
    loading,
    user,
    guestUserId,
    effectiveUserId,
    filter,
    setFilter,
    search,
    setSearch,
    list,
    create,
    rename,
    archive,
    remove,
    updateGuestMessages,
    loadGuestMessages,
    ensureGuestConversation,
  }
}
