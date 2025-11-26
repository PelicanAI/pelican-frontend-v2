# Frontend Audit Report: Message Passing & Conversation State
**Priority:** CRITICAL  
**Date:** 2024  
**Issue:** Backend logs show `[STREAM] Using 0 messages from frontend`

---

## Executive Summary

This audit traces the complete message flow from user input through state management to the API call. The frontend **does send conversation history**, but there are potential race conditions and state synchronization issues that could result in empty history arrays being sent.

### Key Findings

1. ✅ **Message history IS being captured and sent** - The code correctly builds `conversationHistory` before API calls
2. ⚠️ **Race condition risk exists** - State updates happen AFTER history capture, which could lead to stale data
3. ⚠️ **Multiple code paths** - Both streaming and non-streaming paths exist with slightly different payload structures
4. ⚠️ **State synchronization gaps** - Messages loaded from DB may overwrite in-memory state during active conversations
5. ⚠️ **Backend field name mismatch** - Frontend sends `conversationHistory` but backend may expect different field names

---

## 1. Conversation State Management Audit

### State Storage Location

**Primary State:** React `useState` in `hooks/use-chat.ts`
```typescript
const [messages, setMessages] = useState<Message[]>([])
```

**State Reference (for closures):** `useRef` to access latest state
```typescript
const messagesRef = useRef<Message[]>([])

useEffect(() => {
  messagesRef.current = messages
}, [messages])
```

**Location:** `Pelican-frontend/hooks/use-chat.ts:49-56`

### State Persistence

- **In-memory only during active session** - Messages are stored in React state
- **Database persistence** - Messages are fetched from Supabase when:
  - Conversation ID changes (switching conversations)
  - Component mounts with a conversation ID
- **No localStorage** - Guest mode has been removed (per code comments)

### State Loading Flow

**When messages are loaded from database:**
```typescript
// hooks/use-chat.ts:142-178
if (conversationData?.conversation?.messages && loadedConversationRef.current !== currentConversationId) {
  const loadedMessages = conversationData.conversation.messages
    .map((msg: any) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.created_at),
      isStreaming: false,
    }))
    .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime())
  
  // Only update if not in progress
  if (!isLoading && !isStreaming) {
    setMessages(loadedMessages)
    loadedConversationRef.current = currentConversationId
  }
}
```

**Critical Protection:** The code prevents DB data from overwriting active conversation state:
- Checks `!isLoading && !isStreaming` before updating
- Uses `loadedConversationRef` to track which conversation was loaded

### State Update Timing

**Issue Identified:** State updates happen AFTER history capture

```typescript
// hooks/use-chat.ts:463-477 (sendMessageStreaming)
const conversationHistory = messagesRef.current  // ← CAPTURE HERE (line 465)
  .filter((msg) => msg.role !== "system")
  .slice(-(LIMITS.MESSAGE_CONTEXT - 1))

// THEN update state (lines 476-483)
if (!options.skipUserMessage) {
  setMessages((prev) => [...prev, userMessage])  // ← STATE UPDATE AFTER
}
setMessages((prev) => [...prev, assistantMessage])
```

This is actually **CORRECT** - using `messagesRef.current` ensures we get the latest state even if React hasn't re-rendered yet. However, the timing of when `messagesRef.current` is updated could cause issues.

---

## 2. API Call Audit

### Streaming API Call Path (Active)

**Current Flow:**
1. `app/chat/page.tsx` → `useChat().sendMessage()`
2. `hooks/use-chat.ts` → `sendMessageStreaming()` (line 441)
3. `hooks/use-streaming-chat.ts` → `sendMessage()` (line 24)
4. Direct call to: `${BACKEND_URL}/api/pelican_stream` (Fly.io backend)

**API Call Location:** `hooks/use-streaming-chat.ts:50-83`

### Payload Structure

**Actual payload sent to backend:**
```typescript
// hooks/use-streaming-chat.ts:57-67
{
  message: string,                    // Current user message
  conversationHistory: Array<{        // History array
    role: 'user' | 'assistant',
    content: string
  }>,
  conversationId: string | null,      // Conversation ID
  files: string[]                     // File IDs
}
```

**Key Observation:** Payload does NOT include:
- `user_id` (backend must extract from auth token)
- `session_id` (may be needed by backend)
- `conversation_history` (alternative field name - frontend only sends `conversationHistory`)

### Non-Streaming Path (Legacy/Alternative)

There's also a non-streaming path in `use-chat.ts:194-438` that calls `/api/pelican_response`:

```typescript
// hooks/use-chat.ts:254-260
body: JSON.stringify({
  message: userMessage.content,
  conversationId: currentConversationId,
  conversationHistory: conversationHistory,
  conversation_history: conversationHistory,  // ← Sends BOTH field names
  files: options.fileIds || [],
}),
```

**Difference:** Non-streaming path sends BOTH `conversationHistory` AND `conversation_history`, while streaming only sends `conversationHistory`.

---

## 3. Message Array Construction Audit

### Step-by-Step Flow

#### Step 1: User Types Message
**Location:** `app/chat/page.tsx:367`
```typescript
<ChatInput onSendMessage={handleSendMessageWithFiles} />
```

#### Step 2: Message Handler
**Location:** `hooks/use-message-handler.ts:29-47`
```typescript
const handleSendMessage = useCallback(async (content: string, options?) => {
  if (chatLoading || options?.forceQueue) {
    setPendingDraft(content)  // Queue if busy
    return
  }
  await sendMessage(content, { fileIds, attachments })
}, [chatLoading, currentConversationId, sendMessage])
```

#### Step 3: History Capture (BEFORE State Update)
**Location:** `hooks/use-chat.ts:463-468`
```typescript
// Capture history BEFORE modifying state
const conversationHistory = messagesRef.current
  .filter((msg) => msg.role !== "system")
  .slice(-(LIMITS.MESSAGE_CONTEXT - 1))  // Last 149 messages (reserve 1 for new)
  .map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))
```

**Critical Detail:** History is captured from `messagesRef.current`, which is updated via `useEffect`:
```typescript
useEffect(() => {
  messagesRef.current = messages  // Sync ref when state changes
}, [messages])
```

**Potential Race Condition:**
- If `setMessages()` is called but React hasn't re-rendered yet
- `messagesRef.current` might not reflect the latest state
- This could cause history to be missing the most recent messages

#### Step 4: State Updates
**Location:** `hooks/use-chat.ts:475-483`
```typescript
// Add user message (if not regenerating)
if (!options.skipUserMessage) {
  setMessages((prev) => [...prev, userMessage])
}

// Add empty assistant message placeholder
const assistantMessage = createAssistantMessage("")
assistantMessage.isStreaming = true
setMessages((prev) => [...prev, assistantMessage])
```

#### Step 5: API Call
**Location:** `hooks/use-chat.ts:492`
```typescript
await sendStreamingMessage(
  content,
  conversationHistory,  // ← Pass captured history
  { /* callbacks */ },
  currentConversationId,
  options.fileIds || []
)
```

#### Step 6: Payload Construction
**Location:** `hooks/use-streaming-chat.ts:57-67`
```typescript
body: JSON.stringify({
  message,
  conversationHistory: conversationHistory
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role,
      content: msg.content
    })),
  conversationId: conversationId,
  files: fileIds || [],
})
```

**Observation:** History is filtered AGAIN here (duplicate filtering already done in step 3).

---

## 4. Race Condition Analysis

### Identified Race Conditions

#### Race Condition #1: State Update Timing
**Location:** `hooks/use-chat.ts:465-477`

**Scenario:**
1. User sends message #5
2. History captured from `messagesRef.current` (has messages 1-4)
3. `setMessages()` called to add message #5
4. React state update happens asynchronously
5. API call starts with history missing message #5
6. `messagesRef.current` updates AFTER API call starts

**Current Mitigation:**
- Uses `messagesRef.current` instead of `messages` state
- Ref is synced via `useEffect`, but this is still asynchronous

**Risk Level:** **MEDIUM** - Could cause missing recent messages in history

#### Race Condition #2: Database Fetch During Active Conversation
**Location:** `hooks/use-chat.ts:142-178`

**Scenario:**
1. User sends message in active conversation
2. SWR revalidates conversation data (background fetch)
3. Database fetch completes and returns old messages (without new ones)
4. `useEffect` runs and overwrites state with stale DB data
5. API call uses stale history

**Current Mitigation:**
```typescript
if (!isLoading && !isStreaming) {  // ← Prevents overwrite during active conversation
  setMessages(loadedMessages)
}
```

**Risk Level:** **LOW** - Protected by guards, but SWR revalidation could still trigger

#### Race Condition #3: Rapid Message Sending
**Scenario:**
1. User sends message #1 → API call starts
2. User rapidly sends message #2 before #1 completes
3. Message #2 captures history that includes #1 (in state but not yet in DB)
4. Both API calls have different history snapshots

**Risk Level:** **LOW** - Backend should handle this, but could cause cache contamination

### Missing Race Condition Protections

**No check for:**
- Messages being loaded from DB while API call is in progress
- Multiple concurrent API calls with different history snapshots
- State updates happening between history capture and API call

---

## 5. Backend Payload Extraction Audit

### Frontend Sends (Streaming Path)

**Payload structure:**
```json
{
  "message": "user message text",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "conversationId": "uuid-string",
  "files": []
}
```

### Frontend Sends (Non-Streaming Path)

**Payload structure:**
```json
{
  "message": "user message text",
  "conversationId": "uuid-string",
  "conversationHistory": [...],  // ← Field name 1
  "conversation_history": [...], // ← Field name 2 (duplicate!)
  "files": []
}
```

### Backend Expects (Based on Next.js Route)

**Location:** `app/api/pelican_stream/route.ts:26-31`

```typescript
interface StreamingRequest {
  message: string
  conversationId?: string | null
  conversationHistory?: Array<{ role: string; content: string }>  // ← Expected field
  fileIds?: string[]
}
```

**Backend extraction:**
```typescript
const { 
  message, 
  conversationId, 
  conversationHistory = [],  // ← Defaults to empty array!
  fileIds = []
}: StreamingRequest = await req.json()
```

**Critical Issue:** Backend defaults to `[]` if field is missing or undefined. This means:
- If frontend sends empty array → Backend uses empty array
- If frontend sends `null` → Backend uses empty array
- If frontend sends `undefined` → Backend uses empty array

### Backend Forwarding to Pelican Service

**Location:** `app/api/pelican_stream/route.ts:110-120`

```typescript
const requestBody = {
  message: userMessage,
  user_id: effectiveUserId || "anonymous",
  conversation_id: activeConversationId || null,
  session_id: activeConversationId || null,
  timestamp: new Date().toISOString(),
  stream: true,
  conversationHistory: conversationHistory,         // ← Forwards as-is
  conversation_history: conversationHistory,        // ← ALSO forwards with alternative name
  files: fileIds || [],
}
```

**Observation:** Next.js route forwards to Fly.io backend with BOTH field names, but frontend only sends ONE field name in streaming path.

---

## 6. Payload Trace Logging

### Current Logging

**Frontend logs (use-chat.ts):**
```typescript
logger.info("Sending streaming message", { 
  messageLength: content.length,
  historyLength: conversationHistory.length  // ← Logs length only
})
```

**Backend logs (pelican_stream/route.ts):**
```typescript
logger.info("Received streaming request", {
  messageLength: message?.length || 0,
  conversationId,
  historyLength: conversationHistory.length,  // ← Logs length only
})
```

**Missing Logs:**
- ❌ Full payload structure not logged
- ❌ Individual message count breakdown not logged
- ❌ Message content preview not logged
- ❌ Payload at each step of transformation not logged

---

## 7. Critical Issues Identified

### Issue #1: Empty History Array Possible
**Severity:** CRITICAL

**Root Cause:**
- New conversation: `messagesRef.current` is empty → sends `[]`
- Conversation switch: History captured before DB load completes → sends `[]`
- State reset: Messages cleared but API call still references old state → sends `[]`

**Evidence:**
```typescript
// hooks/use-chat.ts:465
const conversationHistory = messagesRef.current  // ← Could be empty!
  .filter((msg) => msg.role !== "system")
  .slice(-(LIMITS.MESSAGE_CONTEXT - 1))
```

**When this happens:**
1. User starts new conversation (no messages yet)
2. User sends first message
3. `messagesRef.current = []` (empty array)
4. History captured: `[]` (empty)
5. API call sends: `conversationHistory: []`
6. Backend receives: `conversationHistory = []` (0 messages)

### Issue #2: Field Name Inconsistency
**Severity:** MEDIUM

**Problem:**
- Streaming path sends only `conversationHistory`
- Non-streaming path sends both `conversationHistory` AND `conversation_history`
- Backend expects `conversationHistory` but also checks `conversation_history` as fallback

**Risk:** If backend checks `conversation_history` first, streaming payloads might be ignored.

### Issue #3: State Synchronization Gap
**Severity:** MEDIUM

**Problem:**
- `messagesRef.current` updated via `useEffect` (asynchronous)
- History captured immediately after state update
- Ref might not be updated yet

**Timeline:**
```
T0: setMessages([...prev, newMessage])
T1: API call captures messagesRef.current  // ← Might not have newMessage yet
T2: useEffect runs and updates messagesRef.current
```

### Issue #4: Missing Validation
**Severity:** LOW

**Problem:**
- No check if `conversationHistory` is empty before sending
- No warning when sending 0 messages
- No fallback to fetch from database if state is empty

---

## 8. State Flow Diagram

```
User Input (ChatInput)
    ↓
handleSendMessageWithFiles (page.tsx)
    ↓
useMessageHandler.handleSendMessage
    ↓
useChat.sendMessage (use-chat.ts)
    ↓
sendMessageStreaming()
    ↓
[CAPTURE HISTORY] ← messagesRef.current
    ↓
[UPDATE STATE] ← setMessages() (async)
    ↓
[SYNC REF] ← useEffect (async, may not complete before API call)
    ↓
useStreamingChat.sendMessage()
    ↓
[BUILD PAYLOAD] ← conversationHistory array
    ↓
POST /api/pelican_stream (Fly.io backend)
    ↓
Backend receives payload
    ↓
Backend extracts conversationHistory (defaults to [] if missing)
    ↓
Backend forwards to Pelican service
```

---

## 9. Immediate Action Items

### Priority P0: Add Comprehensive Logging

**Frontend (use-chat.ts):**
```typescript
// Before API call
console.log('[SEND-1] Current state messages:', messagesRef.current.length);
console.log('[SEND-2] Building payload...');
console.log('[SEND-3] Payload messages count:', conversationHistory.length);
console.log('[SEND-4] Full payload:', JSON.stringify({
  message: content,
  conversationHistory: conversationHistory,
  conversationId: currentConversationId
}, null, 2));
```

**Backend (pelican_stream/route.ts):**
```typescript
logger.info("Received streaming request", {
  messageLength: message?.length || 0,
  conversationId,
  historyLength: conversationHistory.length,
  historyPreview: conversationHistory.slice(0, 3).map(m => ({
    role: m.role,
    contentLength: m.content?.length || 0
  })),
  fullPayload: JSON.stringify({ message, conversationHistory, conversationId })
});
```

### Priority P0: Fix Empty History Detection

**Add validation in use-chat.ts:**
```typescript
const conversationHistory = messagesRef.current
  .filter((msg) => msg.role !== "system")
  .slice(-(LIMITS.MESSAGE_CONTEXT - 1))
  .map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

// CRITICAL: Log and warn if empty
if (conversationHistory.length === 0 && currentConversationId) {
  logger.warn("Sending empty conversation history for existing conversation", {
    conversationId: currentConversationId,
    messagesStateLength: messagesRef.current.length,
    messagesState: messagesRef.current.map(m => ({ role: m.role, id: m.id }))
  })
}
```

### Priority P1: Ensure Field Name Consistency

**Update streaming path to send both field names:**
```typescript
// hooks/use-streaming-chat.ts:57-67
body: JSON.stringify({
  message,
  conversationHistory: conversationHistory.map(...),
  conversation_history: conversationHistory.map(...),  // ← ADD THIS
  conversationId: conversationId,
  files: fileIds || [],
})
```

### Priority P1: Fix State Synchronization

**Option A: Use functional state updates**
```typescript
// Capture history using functional update
setMessages((prevMessages) => {
  const history = prevMessages
    .filter((msg) => msg.role !== "system")
    .slice(-(LIMITS.MESSAGE_CONTEXT - 1))
  
  // Make API call with history before updating state
  sendStreamingMessage(content, history, ...)
  
  // Return updated state
  return [...prevMessages, userMessage]
})
```

**Option B: Ensure ref is updated synchronously**
```typescript
// Update ref immediately, not via useEffect
messagesRef.current = messages
setMessages([...messages, newMessage])
messagesRef.current = [...messagesRef.current, newMessage]  // Sync immediately
```

---

## 10. Integration Test Scenarios

### Test Case 1: New Conversation
**Expected:** First message should have empty history
**Current Behavior:** ✅ Correct (empty array sent)
**Backend Log:** `[STREAM] Using 0 messages` - This is EXPECTED for first message

### Test Case 2: Second Message in Conversation
**Expected:** History should include first message
**Current Behavior:** ⚠️ May send empty if state not synced
**Risk:** High

### Test Case 3: Conversation Switch
**Expected:** Should load messages from DB before sending
**Current Behavior:** ⚠️ May send empty if switch happens too quickly
**Risk:** Medium

### Test Case 4: Rapid Message Sending
**Expected:** Each message should include previous messages
**Current Behavior:** ⚠️ Race condition possible
**Risk:** Medium

---

## 11. Recommendations

### Short-Term (Immediate)

1. **Add logging** at every step of payload construction
2. **Add validation** to detect and log empty history arrays
3. **Fix field name consistency** - send both `conversationHistory` and `conversation_history`
4. **Add warning** when sending 0 messages for existing conversation

### Medium-Term (Next Sprint)

1. **Fix state synchronization** - ensure ref is updated before API call
2. **Add fallback mechanism** - fetch from DB if state is empty
3. **Add integration tests** for all race condition scenarios
4. **Standardize payload structure** across all API paths

### Long-Term (Architecture)

1. **Consider state management library** (Zustand/Redux) for better synchronization
2. **Implement message queue** to prevent race conditions
3. **Add payload validation** on both frontend and backend
4. **Create unified API client** to ensure consistent payload structure

---

## 12. Conclusion

The frontend **does attempt to send conversation history**, but there are several points of failure:

1. **Empty state** - New conversations naturally have empty history
2. **Timing issues** - State may not be synced when history is captured
3. **Field name mismatch** - Backend may not find history due to field name differences
4. **Missing validation** - No checks to ensure history is populated

**Most Likely Cause of "0 messages" issue:**
- **Scenario 1:** New conversation (expected behavior)
- **Scenario 2:** State not synced when history captured (race condition)
- **Scenario 3:** Backend not extracting from correct field name (mismatch)

**Next Steps:**
1. Add comprehensive logging to trace exact payload at each step
2. Verify backend is checking correct field names
3. Fix state synchronization to ensure ref is up-to-date
4. Add validation and warnings for empty history scenarios

---

**Report Generated:** 2024  
**Files Analyzed:**
- `hooks/use-chat.ts`
- `hooks/use-streaming-chat.ts`
- `app/api/pelican_stream/route.ts`
- `app/chat/page.tsx`
- `hooks/use-message-handler.ts`

