# Frontend Team (Next.js/Vercel) Questions - Answers

## 1. Conversation History Management

### Q1: How many prior messages does the frontend send in conversationHistory?

**Answer: Last 149 messages (MESSAGE_CONTEXT - 1)**

**Code Location:** [`hooks/use-chat.ts`](Pelican-frontend/hooks/use-chat.ts:202-208)

```202:208:Pelican-frontend/hooks/use-chat.ts
      const conversationHistory = messagesRef.current
        .filter((msg) => msg.role !== "system")
        .slice(-(LIMITS.MESSAGE_CONTEXT - 1)) // Reserve 1 slot for new message
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
```

**Constants:**
```3:3:Pelican-frontend/lib/constants.ts
  MESSAGE_CONTEXT: 150, // Context window for comprehensive conversation history
```

**Details:**
- **MESSAGE_CONTEXT = 150** (maximum messages to send)
- **Actually sends: 149 messages** (reserves 1 slot for the new message being sent)
- **Filters out:** System messages (only sends user and assistant messages)
- **Same for all query types:** No different amounts for different query types

**Example:**
- If conversation has 200 messages → sends last 149 messages
- If conversation has 50 messages → sends all 50 messages
- If conversation has 0 messages → sends empty array `[]`

---

### Q2: In the request payload, what does conversationHistory contain at message 15?

**Answer: Full array of 14 prior messages (all that exist)**

**Code Logic:**
```202:208:Pelican-frontend/hooks/use-chat.ts
      const conversationHistory = messagesRef.current
        .filter((msg) => msg.role !== "system")
        .slice(-(LIMITS.MESSAGE_CONTEXT - 1)) // Reserve 1 slot for new message
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
```

**At Message 15:**
- `messagesRef.current` contains 14 prior messages (message 15 is being sent)
- `.slice(-149)` takes last 149 messages (but only 14 exist)
- Result: **Array of 14 messages** (all prior messages)

**Format:**
```typescript
[
  { role: "user", content: "Message 1" },
  { role: "assistant", content: "Response 1" },
  { role: "user", content: "Message 2" },
  // ... up to 14 messages total
]
```

**Frontend implements its own truncation:**
- Uses `.slice(-(LIMITS.MESSAGE_CONTEXT - 1))` to limit to last 149 messages
- No pagination - sends all available messages up to the limit
- Truncation happens client-side before sending to backend

---

### Q3: When does frontend send conversationHistory: null vs conversationHistory: [] vs omitting the field entirely?

**Answer: Frontend ALWAYS sends conversationHistory as an array (never null, never omitted)**

**Code Evidence:**
```202:208:Pelican-frontend/hooks/use-chat.ts
      const conversationHistory = messagesRef.current
        .filter((msg) => msg.role !== "system")
        .slice(-(LIMITS.MESSAGE_CONTEXT - 1))
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
```

**Behavior:**
- **New conversation (0 messages):** `conversationHistory: []` (empty array)
- **Existing conversation (N messages):** `conversationHistory: [{...}, {...}]` (array of messages)
- **Never sends:** `conversationHistory: null` or omits the field

**Request Payload:**
```254:260:Pelican-frontend/hooks/use-chat.ts
            body: JSON.stringify({
              message: userMessage.content,
              conversationId: currentConversationId,
              conversationHistory: conversationHistory,
              conversation_history: conversationHistory, // Backend expects both formats
              fileIds: options.fileIds,
            }),
```

**Note:** Frontend sends BOTH `conversationHistory` and `conversation_history` fields (for backward compatibility).

**Backend Special Logic (from question):**
The backend has special logic for:
- `null` = new conversation
- `missing field` = fetch from DB
- `[]` = empty history

**Frontend Behavior:**
- Frontend **does NOT** send `null` or omit the field
- Frontend **always** sends an array (empty `[]` or populated)
- Backend cannot distinguish "new conversation" vs "empty history" from frontend payload alone
- Backend must rely on `conversationId: null` to detect new conversations

---

### Q4: Does the frontend implement any client-side caching of responses?

**Answer: YES - SWR cache for conversation data, NO - No localStorage/service worker cache for messages**

**SWR Cache (Conversation Data):**
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

**SWR Configuration:**
- **Cache Key:** `/api/conversations/${conversationId}`
- **Revalidation:** Disabled on focus/reconnect (prevents data loss)
- **Deduping:** 5 second interval (prevents rapid refetches)
- **Cache Location:** In-memory (React component state via SWR)

**React State (Messages):**
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

**No Persistence:**
- ❌ **No localStorage** for messages
- ❌ **No sessionStorage** for messages
- ❌ **No service worker** cache
- ❌ **No IndexedDB** storage

**What Persists:**
- ✅ **SWR cache** (in-memory, lost on page refresh)
- ✅ **React state** (in-memory, lost on page refresh)
- ✅ **URL params** (conversationId in URL persists across refresh)

**On Page Refresh:**
- Messages are **fetched from database** via SWR
- No client-side cache of message responses
- Conversation list is **fetched from database** (not cached)

---

## 2. Message Ordering & IDs

### Q5: How does frontend track message position/index?

**Answer: Messages are tracked by unique ID and array position, not sequential numbering**

**Message ID Generation:**
```39:41:Pelican-frontend/lib/chat-utils.ts
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

**Format:** `msg_{timestamp}_{random}`

**Example:** `msg_1705939200000_k3j9x2p1q`

**Message Structure:**
```1:11:Pelican-frontend/lib/chat-utils.ts
export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isStreaming?: boolean
  isPinned?: boolean
  isEdited?: boolean
  attachments?: Attachment[] // Added attachments property
  retryAction?: () => void // Added retry action to system messages
}
```

**Tracking Method:**
- **Unique ID:** Each message has a unique ID (not sequential numbers)
- **Array Position:** Messages stored in array, position = index
- **Timestamp:** Each message has `timestamp: Date` for chronological ordering

**Message Storage:**
```49:49:Pelican-frontend/hooks/use-chat.ts
  const [messages, setMessages] = useState<Message[]>([])
```

**Ordering:**
- Messages are stored in chronological order (oldest first)
- When loaded from database, sorted by `created_at`:
```149:157:Pelican-frontend/hooks/use-chat.ts
      const loadedMessages = conversationData.conversation.messages
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isStreaming: false,
        }))
        .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime()) // Sort chronologically (oldest first)
```

**On Page Refresh:**
- Messages are **fetched from database** via SWR
- Database messages have UUID IDs (not frontend-generated IDs)
- Frontend-generated IDs (`msg_*`) are only for optimistic updates
- After refresh, messages use database UUIDs

**Race Condition Protection:**
```78:85:Pelican-frontend/hooks/use-chat.ts
  // 🔧 FIX: Only fetch from DB when switching conversations, not during active conversation
  const shouldFetchConversation =
    !!currentConversationId &&
    !currentConversationId.startsWith("guest-") &&
    !currentConversationId.startsWith("temp-") &&
    !isStreaming && // Don't fetch while streaming - messages aren't in DB yet
    !isLoading && // Don't fetch while loading - prevents race condition
    currentConversationId !== loadedConversationRef.current // Only fetch if we haven't loaded this conversation yet
```

---

### Q6: When user sends a new message, does frontend wait for backend response before adding to history?

**Answer: NO - Frontend optimistically adds message immediately (before backend response)**

**Optimistic Update Flow:**
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

**Sequence:**
1. **User clicks send** → `sendMessage()` called
2. **Capture history** → `conversationHistory` captured from `messagesRef.current` (BEFORE adding new message)
3. **Add user message** → Optimistically added to UI immediately
4. **Add assistant placeholder** → Empty assistant message added immediately
5. **Call backend** → Request sent to Fly.io
6. **Update assistant message** → Content filled in as response arrives

**Race Condition Protection:**
```200:201:Pelican-frontend/hooks/use-chat.ts
      // 🔧 FIX: Capture conversation history BEFORE modifying state
      // This ensures we send the correct context, not stale data from SWR refetch
```

**Why This Matters:**
- History is captured **before** optimistic update
- Ensures backend receives correct context (without the new message)
- Prevents sending stale data if SWR refetches during send

**Could This Cause Race Conditions?**

**Potential Issues:**
1. **User sends message → refreshes page → message not in DB yet**
   - Message appears in UI but may not be saved
   - On refresh, message disappears (not in database)

2. **User sends message → backend fails → message still in UI**
   - Frontend removes assistant message on error
   - User message remains (optimistic update)
   - User may think message was sent successfully

3. **Multiple tabs with same conversation**
   - Each tab has its own React state
   - Optimistic updates are per-tab
   - No cross-tab synchronization

**Error Handling:**
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

**Note:** On error, assistant message is removed, but **user message remains** (optimistic update not rolled back).

---

## 3. Session & Conversation IDs

### Q7: How is sessionId / conversationId generated?

**Answer: conversationId is created by backend, stored in URL params and React state**

**Conversation ID Source:**
- **Created by:** Backend (Fly.io) creates conversation in Supabase
- **Frontend receives:** `conversationId` in backend response
- **Stored in:** URL params (`?conversation={id}`) and React state

**URL Params (Primary Storage):**
```29:30:Pelican-frontend/hooks/use-conversation-router.ts
  const router = useRouter()
  const searchParams = useSearchParams()
```

```36:61:Pelican-frontend/hooks/use-conversation-router.ts
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

      const id = latestId || (await createConversation("New Chat"))?.id
      if (id) {
        router.replace(`${ROUTES.CHAT}?conversation=${encodeURIComponent(id)}`, { scroll: false })
      }
    })()
  }, [searchParams, user, conversations, createConversation, router])
```

**React State:**
```51:51:Pelican-frontend/hooks/use-chat.ts
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)
```

**On New Conversation:**
```118:120:Pelican-frontend/app/chat/page.tsx
    onConversationCreated: (conversationId: string) => {
      conversationRouter.setCurrentConversationId(conversationId)
    },
```

**Persistence:**
- ✅ **URL params:** Persists across page refresh (Next.js router)
- ✅ **React state:** Lost on page refresh (re-initialized from URL)
- ❌ **localStorage:** NOT used for conversationId
- ❌ **cookies:** NOT used for conversationId

**On Page Refresh:**
```103:124:Pelican-frontend/hooks/use-chat.ts
  useEffect(() => {
    setCurrentConversationId(conversationId || null)
    setConversationNotFound(false)
    
    if (conversationId !== loadedConversationRef.current) {
      // Only clear messages when switching between two REAL conversations
      // Don't clear when going from null → first conversation (cold start)
      // This prevents the welcome screen from flashing on initial load
      const isSwitchingConversations = 
        loadedConversationRef.current !== null && 
        conversationId !== null &&
        conversationId !== loadedConversationRef.current
      
      if (isSwitchingConversations) {
        // Clear messages immediately when switching to prevent showing old messages
        setMessages([])
        loadedConversationRef.current = null
      }
      // If cold start (null → conversationId), let the fetch populate messages
      // without clearing first - this prevents welcome screen flash
    }
  }, [conversationId])
```

**Session ID (Different from conversationId):**
```87:90:Pelican-frontend/lib/trading-metadata.ts
export function getTradingSessionId(userId: string): string {
  const today = new Date().toISOString().split('T')[0]
  return `${userId}_trading_${today}`
}
```

**Note:** `sessionId` is generated but **NOT actually used** - code sets `session_id` to `conversationId` instead (see FRONTEND_TEAM_QUESTIONS_ANSWERS.md).

---

### Q8: Can the same conversationId ever be reused?

**Answer: YES - Same conversationId can be opened in multiple tabs, NO cross-tab synchronization**

**Same Conversation in Multiple Tabs:**
- Each tab has **independent React state**
- Each tab fetches messages **independently** via SWR
- No cross-tab message synchronization
- No shared state between tabs

**URL-Based Navigation:**
```73:89:Pelican-frontend/hooks/use-conversation-router.ts
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
```

**Cache Key (SWR):**
```91:91:Pelican-frontend/hooks/use-chat.ts
  } = useSWR(shouldFetchConversation ? `/api/conversations/${currentConversationId}` : null, {
```

**Potential Issues:**

1. **Tab 1 sends message → Tab 2 doesn't see it**
   - Each tab has independent SWR cache
   - No realtime subscription for messages
   - Tab 2 must refresh to see new messages

2. **Tab 1 sends message → Tab 2 sends message → Race condition**
   - Both tabs send optimistic updates
   - Both tabs may send same conversationHistory
   - Backend may receive duplicate or out-of-order messages

3. **Tab 1 refreshes → Tab 2 still has old state**
   - Tab 1 fetches fresh data from database
   - Tab 2 still has stale React state
   - No synchronization mechanism

**Realtime Subscriptions (Conversations Only):**
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

**Note:** Realtime subscription only updates **conversation list** (sidebar), NOT individual messages.

**Could This Cause Cached Response Issues?**

**SWR Cache Behavior:**
- SWR cache is **per-tab** (in-memory)
- Cache key: `/api/conversations/${conversationId}`
- No shared cache between tabs
- Each tab has independent cache

**Scenario: Tab 1 receives response → Tab 2 opens same conversation**
- Tab 2 fetches from database (not from Tab 1's cache)
- Tab 2 gets fresh data from Supabase
- No risk of receiving Tab 1's cached response

**However:**
- If Tab 2 opens conversation **before** Tab 1's message is saved to DB
- Tab 2 won't see Tab 1's message (not in database yet)
- This is a **timing issue**, not a cache issue

---

## Summary

### Conversation History
- **Sends:** Last 149 messages (MESSAGE_CONTEXT - 1)
- **At message 15:** Sends all 14 prior messages
- **Always sends array:** Never null, never omitted
- **Caching:** SWR cache for conversations, no localStorage for messages

### Message Ordering & IDs
- **Tracking:** Unique IDs (`msg_{timestamp}_{random}`) + array position
- **On refresh:** Fetches from database (UUIDs from DB)
- **Optimistic updates:** Messages added immediately, not waiting for backend

### Session & Conversation IDs
- **conversationId:** Created by backend, stored in URL params
- **sessionId:** Generated but not used (bug - sets to conversationId instead)
- **Reuse:** Same conversationId can be opened in multiple tabs
- **Synchronization:** No cross-tab sync for messages (only conversation list)

### Key Findings

1. **Frontend always sends conversationHistory as array** (never null/omitted)
2. **Backend must rely on conversationId: null** to detect new conversations
3. **No cross-tab message synchronization** - each tab is independent
4. **Optimistic updates** happen before backend confirmation
5. **SWR cache is per-tab** - no shared cache between tabs

