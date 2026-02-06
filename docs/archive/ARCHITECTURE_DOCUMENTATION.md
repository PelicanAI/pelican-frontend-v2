# Pelican Chat Architecture Documentation

## Table of Contents
1. [Message Send Flow](#message-send-flow)
2. [Message Persistence](#message-persistence)
3. [Conversation Creation](#conversation-creation)
4. [Title Update Flow](#title-update-flow)
5. [State Management](#state-management)
6. [SWR/React Query Usage](#swrreact-query-usage)
7. [Optimistic Updates](#optimistic-updates)
8. [Guest vs Authenticated](#guest-vs-authenticated)
9. [Error Boundaries](#error-boundaries)
10. [Direct Fly.io Calls](#direct-flyio-calls)
11. [Response Handling](#response-handling)
12. [Vercel Route Status](#vercel-route-status)
13. [Supabase Direct Writes](#supabase-direct-writes)
14. [Authentication Token Passing](#authentication-token-passing)
15. [Rename Function](#rename-function)
16. [Cache Keys](#cache-keys)
17. [Realtime Subscriptions](#realtime-subscriptions)

---

## Message Send Flow

### Exact Flow When User Hits "Send"

1. **User clicks send** in [`chat-input.tsx`](Pelican-frontend/components/chat/chat-input.tsx:152-164)
   - `handleSubmit()` is called
   - Calls `onSendMessage(trimmedMessage)`

2. **Message handler** in [`use-message-handler.ts`](Pelican-frontend/hooks/use-message-handler.ts:29-46)
   - `handleSendMessage()` receives the message
   - If chat is loading, queues the message
   - Otherwise calls `sendMessage()` from `use-chat`

3. **Main chat hook** in [`use-chat.ts`](Pelican-frontend/hooks/use-chat.ts:194-438)
   - **Streaming path** (default, `USE_STREAMING = true`): `sendMessageStreaming()` at line 441
   - **Non-streaming path**: `sendMessage()` at line 194

### Streaming Path (Default)

```441:656:Pelican-frontend/hooks/use-chat.ts
  const sendMessageStreaming = useCallback(
    async (content: string, options: SendMessageOptions = {}) => {
      // ... validation and setup ...
      
      // Get Supabase session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token
      
      // Call streaming hook
      await sendStreamingMessage(
        content,
        conversationHistory,
        callbacks,
        currentConversationId,
        options.fileIds || []
      )
    }
  )
```

4. **Streaming hook** in [`use-streaming-chat.ts`](Pelican-frontend/hooks/use-streaming-chat.ts:24-160)
   - Gets Supabase JWT token
   - Calls **Fly.io directly**: `${BACKEND_URL}/api/pelican_stream`
   - Uses SSE parser to handle streaming chunks

5. **Backend response** handled via callbacks:
   - `onChunk`: Updates message content in real-time
   - `onComplete`: Finalizes message, updates UI
   - `onConversationCreated`: Sets new conversation ID if created

### Non-Streaming Path (Fallback)

```194:438:Pelican-frontend/hooks/use-chat.ts
  const sendMessage = useCallback(
    async (content: string, options: SendMessageOptions = {}) => {
      // ... setup ...
      
      // Get Supabase session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token
      
      // Call Fly.io directly
      const response = await makeRequest(`${BACKEND_URL}/api/pelican_response`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConversationId,
          conversationHistory: conversationHistory,
          fileIds: options.fileIds,
        }),
      })
      
      // Handle response
      const data = await response.json()
      // Update UI with response
    }
  )
```

---

## Where Does the Message Go First?

**Answer: Directly to Fly.io backend, NOT through Vercel API routes**

### Direct Fly.io Call Location

The exact code that calls `pelican-backend.fly.dev`:

**Streaming:**
```50:83:Pelican-frontend/hooks/use-streaming-chat.ts
      // Call Fly.io backend directly with retry logic for network resilience
      const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_stream`, async () => {
        return await streamWithRetry(`${BACKEND_URL}/api/pelican_stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: conversationHistory
              .filter(msg => msg.role !== 'system')
              .map(msg => ({
                role: msg.role,
                content: msg.content
              })),
            conversationId: conversationId,
            fileIds: fileIds || [],
          }),
          signal: controller.signal,
          retryOptions: {
            maxRetries: 2, // Retry failed connections up to 2 times
            baseDelay: 1000, // Start with 1 second delay
            shouldRetry: (error: Error) => {
              // Don't retry if user cancelled
              if (error.name === 'AbortError') return false;
              // Don't retry auth errors
              if (error.message.includes('401') || error.message.includes('403')) return false;
              // Retry network errors (Failed to fetch)
              if (error.message.includes('Failed to fetch') || error.message.includes('network')) return true;
              return true;
            }
          }
        });
      });
```

**Non-Streaming:**
```247:262:Pelican-frontend/hooks/use-chat.ts
        // Call Fly.io backend directly - no Vercel proxy, no timeout constraints
        const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_response`, async () => {
          return await makeRequest(`${BACKEND_URL}/api/pelican_response`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
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
        })
```

**Backend URL Configuration:**
```6:6:Pelican-frontend/lib/pelican-direct.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev';
```

### When Did This Change?

Based on code comments and migration docs, this was changed to bypass Vercel's 10-second timeout limit for streaming responses. The Vercel API routes (`/api/pelican_stream`, `/api/pelican_response`) still exist but are **not called by the frontend** - they're legacy code.

---

## Message Persistence Responsibility

**Answer: Backend (Fly.io) is primary, frontend has fallback saves**

### Backend Responsibility

The Fly.io backend (`pelican-backend.fly.dev`) is responsible for:
- Saving messages to Supabase `messages` table
- Creating memory embeddings
- Updating conversation metadata
- Handling transaction rollback on failure

**Evidence from code comments:**
```208:214:Pelican-frontend/app/api/chat/route.ts
    // 🔧 FIX: Backend already saves messages and creates embeddings
    // Removed duplicate saveMessagesToDatabase() call to prevent constraint violations
    // The backend Pelican service handles:
    // - Message persistence
    // - Memory embedding creation
    // - Conversation metadata updates
```

### Frontend Fallback (Legacy)

The Vercel API routes have **fallback saves** in case backend fails:

```217:261:Pelican-frontend/app/api/chat/route.ts
    // CRITICAL: Force message save verification
    // Backend uses fire-and-forget, so we need to ensure saves happen
    if (activeConversationId && effectiveUserId) {
      try {
        // Save user message
        await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversationId,
            user_id: effectiveUserId,
            role: "user",
            content: userMessage,
            created_at: new Date().toISOString(),
          });
        
        // Save assistant reply
        await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversationId,
            user_id: effectiveUserId,
            role: "assistant",
            content: reply,
            metadata: attachments.length > 0 ? { attachments } : {},
            created_at: new Date().toISOString(),
          });
        
        // Update conversation updated_at
        await supabase
          .from("conversations")
          .update({ 
            updated_at: new Date().toISOString(),
            // Update title if it's still "New Chat"
            ...(data.first_message && { title: userMessage.slice(0, 50) + '...' })
          })
          .eq("id", activeConversationId);
          
        console.log('✅ Messages saved to database');
      } catch (saveError) {
        console.error('⚠️ Failed to save messages, backend may retry:', saveError);
        // Don't throw - still return the response even if save fails
      }
    }
```

**Note:** This fallback is in the Vercel API routes, but since the frontend calls Fly.io directly, this code path is **not executed** in normal operation.

### Coordination Mechanism

There is **no explicit coordination** - the backend handles persistence asynchronously. The frontend trusts the backend to save messages.

---

## Conversation Creation Flow

**Answer: Backend creates conversation on first message if `conversationId` is null**

### When User Sends First Message in "New Chat"

1. **Frontend** sends message with `conversationId: null` or `undefined`

2. **Backend** (Fly.io) receives request and checks:
   ```typescript
   if (!activeConversationId && effectiveUserId) {
     // Create new conversation
   }
   ```

3. **Backend creates conversation** in Supabase:
   ```86:111:Pelican-frontend/app/api/pelican_response/route.ts
    // Create conversation if needed
    if (!activeConversationId && effectiveUserId) {
      const title = sanitizeTitle(userMessage, LIMITS.TITLE_PREVIEW_LENGTH)

      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: effectiveUserId,
          title: title,
        })
        .select()
        .single()

      if (createError) {
        logger.error("Failed to create conversation", createError, { userId: effectiveUserId })
        throw new Error("Failed to create conversation in database")
      }

      activeConversationId = newConversation.id
      logger.info("Created new conversation", { conversationId: activeConversationId, userId: effectiveUserId })
      console.log("✅ [PELICAN_RESPONSE] Created conversation in DB:", { 
        conversationId: activeConversationId,
        title: newConversation.title,
        userId: effectiveUserId,
        createdAt: newConversation.created_at
      })
    }
   ```

4. **Backend returns** `conversationId` in response

5. **Frontend receives** conversation ID via callback:
   ```500:504:Pelican-frontend/hooks/use-chat.ts
            onConversationCreated: (newConversationId) => {
              setCurrentConversationId(newConversationId)
              onConversationCreated?.(newConversationId)
              logger.info("[Streaming] New conversation created", { conversationId: newConversationId })
            },
   ```

**Note:** The frontend does NOT create conversations directly - it's all handled by the backend.

---

## Title Update Flow

**Answer: Automatic after first message, manual via API route**

### Automatic Title Update

After the first message exchange completes:

```341:353:Pelican-frontend/hooks/use-chat.ts
        // Update conversation title if it's the first real message
        if (messages.length <= 2 && currentConversationId) { // 2 because we just added user + assistant
          const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
          
          // Use the API route for consistency
          fetch(`/api/conversations/${currentConversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          }).catch(err => {
            console.error('Failed to update title:', err);
          });
        }
```

### Manual Rename Function

The rename function uses the API route:

```428:476:Pelican-frontend/hooks/use-conversations.ts
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
          // USE THE API ROUTE - Critical for consistency
          const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to rename');
          }
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
          )
          saveGuestConversations(updatedConversations)
        }
        return true
      } catch (error) {
        captureError(error, {
          action: 'rename_conversation',
          component: 'use-conversations',
          conversationId,
          userId: user?.id,
          newTitle
        })
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
    },
    [conversations, user?.id, guestUserId, supabase],
  )
```

**API Route Handler:**
```65:134:Pelican-frontend/app/api/conversations/[id]/route.ts
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { title, archived } = await req.json()
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const updateData: {
      title?: string
      archived?: boolean
      archived_at?: string | null
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (archived !== undefined) {
      updateData.archived = archived
      updateData.archived_at = archived ? new Date().toISOString() : null
    }

    // Update conversation
    const { error } = await supabase
      .from("conversations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null) // Ensure we don't update deleted conversations

    if (error) {
      Sentry.captureException(error, {
        tags: { 
          action: 'conversation_update',
          conversation_id: id 
        },
        extra: { updateData, userId: user.id }
      })
      return NextResponse.json(
        {
          error: "Failed to update conversation",
          code: "update_failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { endpoint: '/api/conversations/[id]', method: 'PATCH' },
      level: 'error'
    })
    return NextResponse.json(
      {
        error: "Failed to update conversation",
        code: "update_failed",
      },
      { status: 500 },
    )
  }
}
```

---

## State Management

**Answer: Local component state + SWR for data fetching, no global state library**

### Current Conversation State

**Location:** [`use-chat.ts`](Pelican-frontend/hooks/use-chat.ts)

```49:57:Pelican-frontend/hooks/use-chat.ts
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)
  const [conversationNotFound, setConversationNotFound] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const loadedConversationRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>([])
```

### Source of Truth

- **UI State (Current Messages):** `messages` state in `use-chat.ts` - this is the source of truth for what's displayed
- **Database State:** Fetched via SWR when switching conversations
- **Conversation List:** Managed in [`use-conversations.ts`](Pelican-frontend/hooks/use-conversations.ts) with local state + Supabase queries

### No Global State Library

- ❌ No Context API for chat state
- ❌ No Zustand
- ❌ No Redux
- ✅ Just React hooks (`useState`, `useRef`) + SWR for data fetching

### Conversation List State

```65:72:Pelican-frontend/hooks/use-conversations.ts
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [guestUserId, setGuestUserId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "archived" | "active">("active")
```

---

## SWR/React Query Usage

**Answer: SWR is used, React Query is not**

### SWR Provider

```1:22:Pelican-frontend/lib/providers/swr-provider.tsx
"use client"

import type React from "react"

import { SWRConfig } from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

### SWR Usage in use-chat

```87:101:Pelican-frontend/hooks/use-chat.ts
  const {
    data: conversationData,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR(shouldFetchConversation ? `/api/conversations/${currentConversationId}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false, // Disable auto-revalidation on reconnect to prevent data loss
    dedupingInterval: 5000, // Prevent rapid refetches
    onError: (error) => {
      logger.error("Conversation fetch error", error instanceof Error ? error : new Error(String(error)))
      if (error.status === 404 || error.status === 403) {
        setConversationNotFound(true)
      }
    },
  })
```

### Cache Invalidation Strategy

After a message is sent, the code **intentionally does NOT** refetch the conversation immediately:

```355:362:Pelican-frontend/hooks/use-chat.ts
        // 🔧 FIX: Don't refetch conversation immediately - causes race condition
        // Trust the local UI state. Only refetch on conversation switch or manual refresh.
        // if (currentConversationId) {
        //   mutateConversation()
        // }
        
        // Update the conversations list (sidebar) but not the current conversation messages
        mutate(API_ENDPOINTS.CONVERSATIONS)
```

**Cache Keys:**
- Conversations list: `/api/conversations` (from `API_ENDPOINTS.CONVERSATIONS`)
- Single conversation: `/api/conversations/${conversationId}`
- Both are user-scoped via Supabase RLS policies

---

## Optimistic Updates

**Answer: Yes, messages are optimistically added, with rollback on error**

### Optimistic Message Addition

```210:222:Pelican-frontend/hooks/use-chat.ts
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
```

### Rollback on Error

```370:386:Pelican-frontend/hooks/use-chat.ts
        if (error instanceof Error && error.name === "AbortError") {
          logger.info("Request cancelled by user")
          // Remove the cancelled assistant message (like ChatGPT/Claude)
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
          return
        }

        // Capture critical API errors in Sentry (except user cancellations)
        captureCriticalError(error, {
          location: "api_call",
          endpoint: "/api/pelican_response",
          conversationId: currentConversationId,
          messageLength: content.length,
        })

        // Remove failed assistant message for other errors too
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
```

### Conversation Rename Optimistic Update

```433:472:Pelican-frontend/hooks/use-conversations.ts
      // Optimistic update
      const previousConversations = conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
        ),
      )

      try {
        if (user?.id) {
          // USE THE API ROUTE - Critical for consistency
          const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to rename');
          }
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
          )
          saveGuestConversations(updatedConversations)
        }
        return true
      } catch (error) {
        captureError(error, {
          action: 'rename_conversation',
          component: 'use-conversations',
          conversationId,
          userId: user?.id,
          newTitle
        })
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
```

---

## Guest vs Authenticated

**Answer: Guest mode is DISABLED - authentication is required**

### Current Status

**Guest mode has been removed.** The codebase shows evidence of guest mode code, but it's been disabled:

```221:225:Pelican-frontend/app/chat/page.tsx
  // Require authentication - no guest mode
  if (!user) {
    router.push('/auth/login')
    return null
  }
```

### Legacy Guest Code (Not Used)

Guest conversation data would have lived in `localStorage`:

```29:47:Pelican-frontend/hooks/use-conversations.ts
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
```

But this is cleaned up on page load:

```145:158:Pelican-frontend/app/chat/page.tsx
  // Clear any old guest data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pelican_guest_mode')
      localStorage.removeItem('pelican_guest_user_id')
      localStorage.removeItem('pelican_guest_conversations')
      // Remove all guest message keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pelican_guest_messages_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])
```

**All users must be authenticated** - no guest mode.

---

## Error Boundaries

**Answer: Errors are shown to users via system messages, not silent failures**

### Error Handling in use-chat

When a message save fails, the user sees an error:

```363:417:Pelican-frontend/hooks/use-chat.ts
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

        // Capture critical API errors in Sentry (except user cancellations)
        captureCriticalError(error, {
          location: "api_call",
          endpoint: "/api/pelican_response",
          conversationId: currentConversationId,
          messageLength: content.length,
        })

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
      }
```

### System Messages

System messages are added to the message list and displayed to the user:

```184:188:Pelican-frontend/hooks/use-chat.ts
  const addSystemMessage = useCallback((content: string, retryAction?: () => void) => {
    const systemMessage = createSystemMessage(content, retryAction)
    setMessages((prev) => [...prev, systemMessage])
    return systemMessage.id
  }, [])
```

**Errors are NOT silent** - users always see what went wrong.

---

## Direct Fly.io Calls

### Exact Code Location

**Streaming:**
```50:83:Pelican-frontend/hooks/use-streaming-chat.ts
      // Call Fly.io backend directly with retry logic for network resilience
      const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_stream`, async () => {
        return await streamWithRetry(`${BACKEND_URL}/api/pelican_stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: conversationHistory
              .filter(msg => msg.role !== 'system')
              .map(msg => ({
                role: msg.role,
                content: msg.content
              })),
            conversationId: conversationId,
            fileIds: fileIds || [],
          }),
          signal: controller.signal,
          retryOptions: {
            maxRetries: 2, // Retry failed connections up to 2 times
            baseDelay: 1000, // Start with 1 second delay
            shouldRetry: (error: Error) => {
              // Don't retry if user cancelled
              if (error.name === 'AbortError') return false;
              // Don't retry auth errors
              if (error.message.includes('401') || error.message.includes('403')) return false;
              // Retry network errors (Failed to fetch)
              if (error.message.includes('Failed to fetch') || error.message.includes('network')) return true;
              return true;
            }
          }
        });
      });
```

**Non-Streaming:**
```247:262:Pelican-frontend/hooks/use-chat.ts
        // Call Fly.io backend directly - no Vercel proxy, no timeout constraints
        const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_response`, async () => {
          return await makeRequest(`${BACKEND_URL}/api/pelican_response`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
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
        })
```

**Backend URL:**
```244:244:Pelican-frontend/hooks/use-chat.ts
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev'
```

---

## Response Handling

### Expected Response Fields

**Streaming Response (SSE):**
- `type: 'conversationId'` - New conversation ID if created
- `type: 'status'` - Status updates
- `type: 'content'` - Content chunks (`delta` field)
- `type: 'attachments'` - Attachments array
- `type: 'done'` - Completion with `full_response` and `latency_ms`
- `type: 'error'` - Error message

**Non-Streaming Response (JSON):**
```268:336:Pelican-frontend/hooks/use-chat.ts
        // Non-streaming response - wait for complete JSON response
        const data = await response.json()
        logger.info("Received API response", { hasError: !!data.error })

        if (data.error) {
          throw new Error(data.error)
        }

        // Handle both OpenAI-style and simpler Pelican format, including attachments
        const rawReply = data.choices?.[0]?.message?.content || data.content || data
        
        // 🔍 [DEBUG] Raw API response logging
        logger.info("🔍 [DEBUG] Raw API response", { 
          hasChoices: !!data.choices,
          hasContent: !!data.content,
          rawReplyType: typeof rawReply,
          rawReplyKeys: typeof rawReply === 'object' && rawReply !== null ? Object.keys(rawReply) : null,
          isObject: typeof rawReply === 'object' && rawReply !== null,
          hasContentProperty: typeof rawReply === 'object' && rawReply !== null && 'content' in rawReply,
          hasAttachmentsProperty: typeof rawReply === 'object' && rawReply !== null && 'attachments' in rawReply
        })
        
        // Extract content and attachments - handle both old format (string) and new format (object)
        let reply: string
        let attachments: Array<{ type: string; name: string; url: string }> = []
        
        if (typeof rawReply === 'object' && rawReply !== null && 'content' in rawReply) {
          // New format with attachments: { content: string, attachments: [...] }
          reply = typeof rawReply.content === 'string' ? rawReply.content : String(rawReply.content || '')
          attachments = Array.isArray(rawReply.attachments) ? rawReply.attachments : []
        } else if (typeof rawReply === 'string') {
          // Old format (plain string)
          reply = rawReply
          attachments = []
        } else {
          // Fallback - ensure we always have a string
          reply = String(rawReply || "No response received")
          attachments = []
        }
        
        // Final safety check - ensure reply is always a string
        if (typeof reply !== 'string') {
          reply = String(reply || "No response received")
        }

        // ✅ [DEBUG] Extracted from response logging
        logger.info("✅ [DEBUG] Extracted from response", { 
          replyLength: reply?.length || 0,
          attachmentsCount: attachments.length,
          firstAttachment: attachments[0] ? {
            type: attachments[0].type,
            name: attachments[0].name,
            urlLength: attachments[0].url?.length || 0,
            urlPrefix: attachments[0].url?.substring(0, 50) || 'no url'
          } : null
        })

        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId)
          onConversationCreated?.(data.conversationId)
          logger.info("New conversation created", { conversationId: data.conversationId })
        }
```

**Response includes:**
- `conversationId` - If a new conversation was created
- `content` or `choices[0].message.content` - The reply text
- `attachments` (optional) - Array of attachments
- **No explicit `messageId`** - Messages are saved by backend, IDs not returned

---

## Vercel Route Status

**Answer: `/api/chat/route.ts` is DEAD CODE - not called by frontend**

### Status of API Routes

1. **`/api/chat/route.ts`** - ❌ **DEAD CODE**
   - Not called by frontend
   - Frontend calls Fly.io directly
   - Still exists for legacy/fallback purposes

2. **`/api/pelican_stream/route.ts`** - ❌ **DEAD CODE**
   - Not called by frontend
   - Frontend calls Fly.io directly
   - Still exists for legacy/fallback purposes

3. **`/api/pelican_response/route.ts`** - ❌ **DEAD CODE**
   - Not called by frontend
   - Frontend calls Fly.io directly
   - Still exists for legacy/fallback purposes

4. **`/api/conversations/route.ts`** - ✅ **ACTIVE**
   - Used for fetching conversation list
   - Used for creating conversations (though backend also creates them)

5. **`/api/conversations/[id]/route.ts`** - ✅ **ACTIVE**
   - Used for fetching single conversation
   - Used for updating conversation (title, archived)
   - Used for deleting conversations

### Evidence

The frontend explicitly calls Fly.io directly:

```244:262:Pelican-frontend/hooks/use-chat.ts
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev'

        // Call Fly.io backend directly - no Vercel proxy, no timeout constraints
        const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_response`, async () => {
```

**Not** calling `/api/pelican_response` (Vercel route).

---

## Supabase Direct Writes

**Answer: Frontend writes directly to Supabase for conversation updates, NOT for messages**

### Direct Supabase Writes

**Conversation Updates:**
```308:331:Pelican-frontend/hooks/use-conversations.ts
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
```

**Conversation Creation (via API route, not direct):**
```192:269:Pelican-frontend/hooks/use-conversations.ts
  const createConversation = async (title = "New Conversation") => {
    const effectiveUserId = user?.id || guestUserId
    if (!effectiveUserId) {
      console.error("❌ [Create Conversation] No user ID available")
      return null
    }

    if (user?.id) {
      try {
        console.log("🔷 [Create Conversation] Attempting to create conversation", { 
          userId: effectiveUserId, 
          title,
          userExists: !!user,
          userEmail: user?.email 
        })
        
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: effectiveUserId,
            title,
          })
          .select()
          .single()

        if (error) {
          console.error("❌ [Create Conversation] Database error:", {
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error
          })
          throw error
        }
        
        console.log("✅ [Create Conversation] Successfully created:", { 
          conversationId: data?.id,
          title: data?.title,
          createdAt: data?.created_at 
        })
        
        // Reload conversations to reflect the new one
        if (user?.id) {
          await loadConversations(user.id)
        }
        
        return data
      } catch (error) {
        console.error("❌ [Create Conversation] Failed:", {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined
        })
        // Capture in Sentry
        Sentry.captureException(error, {
          tags: { location: 'createConversation' },
          extra: { userId: effectiveUserId, title }
        })
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
```

### Messages

**Frontend does NOT write messages directly to Supabase.** Messages are saved by the backend (Fly.io).

The only exception is the fallback save in the Vercel API routes (which aren't called):

```217:261:Pelican-frontend/app/api/chat/route.ts
    // CRITICAL: Force message save verification
    // Backend uses fire-and-forget, so we need to ensure saves happen
    if (activeConversationId && effectiveUserId) {
      try {
        // Save user message
        await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversationId,
            user_id: effectiveUserId,
            role: "user",
            content: userMessage,
            created_at: new Date().toISOString(),
          });
        
        // Save assistant reply
        await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversationId,
            user_id: effectiveUserId,
            role: "assistant",
            content: reply,
            metadata: attachments.length > 0 ? { attachments } : {},
            created_at: new Date().toISOString(),
          });
        
        // Update conversation updated_at
        await supabase
          .from("conversations")
          .update({ 
            updated_at: new Date().toISOString(),
            // Update title if it's still "New Chat"
            ...(data.first_message && { title: userMessage.slice(0, 50) + '...' })
          })
          .eq("id", activeConversationId);
          
        console.log('✅ Messages saved to database');
      } catch (saveError) {
        console.error('⚠️ Failed to save messages, backend may retry:', saveError);
        // Don't throw - still return the response even if save fails
      }
    }
```

But this code path is **not executed** since the frontend calls Fly.io directly.

---

## Authentication Token Passing

**Answer: Supabase JWT is passed in `Authorization: Bearer` header**

### How Token is Passed

```234:243:Pelican-frontend/hooks/use-chat.ts
        // Get Supabase session token for direct backend authentication
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          throw new Error("Authentication required. Please sign in again.")
        }

        const token = session.access_token
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev'
```

```247:253:Pelican-frontend/hooks/use-chat.ts
        // Call Fly.io backend directly - no Vercel proxy, no timeout constraints
        const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_response`, async () => {
          return await makeRequest(`${BACKEND_URL}/api/pelican_response`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
```

**Format:** `Authorization: Bearer <supabase_jwt_token>`

**Validation:** The backend (Fly.io) validates the JWT token. The frontend does not validate it - it just passes it through.

---

## Rename Function

**Answer: Uses API route `/api/conversations/[id]` with PATCH method**

### Rename Function

```428:476:Pelican-frontend/hooks/use-conversations.ts
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
          // USE THE API ROUTE - Critical for consistency
          const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to rename');
          }
        } else {
          const currentConversations = loadGuestConversations()
          const updatedConversations = currentConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title: newTitle, updated_at: new Date().toISOString() } : conv,
          )
          saveGuestConversations(updatedConversations)
        }
        return true
      } catch (error) {
        captureError(error, {
          action: 'rename_conversation',
          component: 'use-conversations',
          conversationId,
          userId: user?.id,
          newTitle
        })
        // Revert optimistic update
        setConversations(previousConversations)
        return false
      }
    },
    [conversations, user?.id, guestUserId, supabase],
  )
```

**Does NOT call Supabase directly** - uses the API route for consistency and server-side validation.

---

## Cache Keys

**Answer: SWR cache keys are user-scoped via Supabase RLS**

### Cache Keys

1. **Conversations List:**
   - Key: `/api/conversations`
   - Defined in: `API_ENDPOINTS.CONVERSATIONS`
   - User-scoped: Yes (via Supabase RLS - only returns user's conversations)

2. **Single Conversation:**
   - Key: `/api/conversations/${conversationId}`
   - User-scoped: Yes (via Supabase RLS - only returns if user owns conversation)

### SWR Configuration

```87:101:Pelican-frontend/hooks/use-chat.ts
  const {
    data: conversationData,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR(shouldFetchConversation ? `/api/conversations/${currentConversationId}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false, // Disable auto-revalidation on reconnect to prevent data loss
    dedupingInterval: 5000, // Prevent rapid refetches
    onError: (error) => {
      logger.error("Conversation fetch error", error instanceof Error ? error : new Error(String(error)))
      if (error.status === 404 || error.status === 403) {
        setConversationNotFound(true)
      }
    },
  })
```

**User-scoping:** Handled by Supabase Row Level Security (RLS) policies, not by cache key structure.

---

## Realtime Subscriptions

**Answer: Yes, Supabase realtime is used for conversations list, NOT for messages**

### Realtime Subscription Setup

```156:172:Pelican-frontend/hooks/use-conversations.ts
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

    return () => {
      subscription.unsubscribe()
    }
  }, [user])
```

**What it does:**
- Listens for changes to `conversations` table
- Filters by `user_id` (only user's conversations)
- Triggers `loadConversations()` on any change (INSERT, UPDATE, DELETE)

**What it does NOT do:**
- ❌ No realtime subscription for `messages` table
- ❌ No cross-tab message syncing
- ✅ Only syncs conversation list (sidebar) across tabs/devices

### Why No Message Realtime?

Messages are streamed in real-time during generation, but once complete, they're only fetched when:
1. User switches conversations (SWR fetch)
2. User manually refreshes

This prevents race conditions where realtime updates could overwrite streaming content.

---

## Summary

### Key Architecture Points

1. **Direct Fly.io Calls:** Frontend calls `pelican-backend.fly.dev` directly, bypassing Vercel API routes
2. **Backend Persistence:** Fly.io backend saves messages to Supabase, not frontend
3. **Conversation Creation:** Backend creates conversations on first message
4. **State Management:** Local React state + SWR for data fetching, no global state library
5. **Optimistic Updates:** Messages added optimistically, rolled back on error
6. **No Guest Mode:** Authentication required for all users
7. **Error Handling:** Errors shown via system messages, not silent
8. **Realtime:** Only for conversations list, not messages
9. **Cache Keys:** User-scoped via Supabase RLS, not cache key structure
10. **Vercel Routes:** Most are dead code, only conversation CRUD routes are active

---

## File Reference Quick Links

### Core Hooks
- [`hooks/use-chat.ts`](Pelican-frontend/hooks/use-chat.ts) - Main chat logic, message sending
- [`hooks/use-conversations.ts`](Pelican-frontend/hooks/use-conversations.ts) - Conversation CRUD, realtime subscriptions
- [`hooks/use-streaming-chat.ts`](Pelican-frontend/hooks/use-streaming-chat.ts) - Streaming message handling
- [`hooks/use-message-handler.ts`](Pelican-frontend/hooks/use-message-handler.ts) - Message queueing and draft management

### Components
- [`components/chat/chat-input.tsx`](Pelican-frontend/components/chat/chat-input.tsx) - Send button, input handling
- [`components/chat/chat-container.tsx`](Pelican-frontend/components/chat/chat-container.tsx) - Message display container
- [`components/chat/chat-sidebar.tsx`](Pelican-frontend/components/chat/chat-sidebar.tsx) - Conversation list sidebar

### API Routes
- [`app/api/chat/route.ts`](Pelican-frontend/app/api/chat/route.ts) - ❌ Dead code (not called)
- [`app/api/pelican_stream/route.ts`](Pelican-frontend/app/api/pelican_stream/route.ts) - ❌ Dead code (not called)
- [`app/api/pelican_response/route.ts`](Pelican-frontend/app/api/pelican_response/route.ts) - ❌ Dead code (not called)
- [`app/api/conversations/route.ts`](Pelican-frontend/app/api/conversations/route.ts) - ✅ Active (list, create)
- [`app/api/conversations/[id]/route.ts`](Pelican-frontend/app/api/conversations/[id]/route.ts) - ✅ Active (get, update, delete)

### Supabase
- [`lib/supabase/client.ts`](Pelican-frontend/lib/supabase/client.ts) - Browser Supabase client
- [`lib/supabase/server.ts`](Pelican-frontend/lib/supabase/server.ts) - Server-side Supabase client

### Utilities
- [`lib/pelican-direct.ts`](Pelican-frontend/lib/pelican-direct.ts) - Direct Fly.io client (legacy, not used)
- [`lib/constants.ts`](Pelican-frontend/lib/constants.ts) - Constants including BACKEND_URL
- [`lib/providers/swr-provider.tsx`](Pelican-frontend/lib/providers/swr-provider.tsx) - SWR configuration
- [`lib/providers/auth-provider.tsx`](Pelican-frontend/lib/providers/auth-provider.tsx) - Auth context

### Main Page
- [`app/chat/page.tsx`](Pelican-frontend/app/chat/page.tsx) - Main chat page component

