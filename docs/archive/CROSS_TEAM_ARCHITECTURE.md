# Cross-Team Architecture Questions & Answers

## Frontend vs Backend Responsibilities

### Question 1: Who saves messages to DB?

**Frontend Answer:** 
- **Backend (Fly.io) saves messages** to Supabase `messages` table
- Frontend does NOT write messages directly to Supabase
- Frontend has fallback save code in Vercel API routes (`/api/chat/route.ts`, `/api/pelican_response/route.ts`), but these routes are **NOT called** by the frontend (dead code)
- Frontend trusts backend to handle persistence asynchronously

**Evidence:**
```208:214:Pelican-frontend/app/api/chat/route.ts
    // 🔧 FIX: Backend already saves messages and creates embeddings
    // Removed duplicate saveMessagesToDatabase() call to prevent constraint violations
    // The backend Pelican service handles:
    // - Message persistence
    // - Memory embedding creation
    // - Conversation metadata updates
```

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should save messages to Supabase `messages` table after processing
- Backend should create memory embeddings
- Backend should update conversation metadata (`updated_at`, `message_count`, `last_message_preview`)

---

### Question 2: Who creates new conversations?

**Frontend Answer:**
- **Backend creates new conversations** when it receives a message with `conversationId: null` or `undefined`
- Frontend does NOT create conversations directly
- Frontend sends `conversationId: null` when user starts a new chat

**Evidence:**
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

**Note:** This code is in the Vercel API route, but since frontend calls Fly.io directly, the **backend (Fly.io) should have similar logic**.

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should check if `conversationId` is null/undefined
- If null, backend should create a new conversation in Supabase `conversations` table
- Backend should return the new `conversationId` in the response

---

### Question 3: Who updates conversation titles?

**Frontend Answer:**
- **Frontend updates conversation titles** via API route `/api/conversations/[id]` with PATCH method
- Frontend does optimistic update, then calls API route
- API route updates Supabase directly

**Evidence:**
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

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend may also update titles when creating conversations (sets initial title from first message)
- Backend should NOT update titles after conversation creation (frontend handles this)

---

### Question 4: What's in the request body to `/api/pelican_response`?

**Frontend Answer:**

**Non-Streaming Request:**
```254:260:Pelican-frontend/hooks/use-chat.ts
            body: JSON.stringify({
              message: userMessage.content,
              conversationId: currentConversationId,
              conversationHistory: conversationHistory,
              conversation_history: conversationHistory, // Backend expects both formats
              fileIds: options.fileIds,
            }),
```

**Streaming Request:**
```57:67:Pelican-frontend/hooks/use-streaming-chat.ts
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
```

**Headers:**
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

**Request Body Structure:**
```typescript
{
  message: string,                    // User's message content
  conversationId: string | null,      // Current conversation ID (null for new chat)
  conversationHistory: Array<{        // Recent conversation history
    role: "user" | "assistant",
    content: string
  }>,
  conversation_history: Array<{...}>, // Duplicate field (backend expects both)
  fileIds?: string[]                  // Optional file IDs if files attached
}
```

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should accept this exact format
- Backend should handle both `conversationHistory` and `conversation_history` fields
- Backend should validate `Authorization: Bearer <token>` header

---

### Question 5: What's in the response from `/api/pelican_response`?

**Frontend Answer:**

**Expected Response Format (Non-Streaming):**
```typescript
{
  choices?: Array<{
    message: {
      role: "assistant",
      content: string | {
        content: string,
        attachments?: Array<{
          type: string,
          name: string,
          url: string
        }>
      }
    },
    finish_reason: "stop"
  }>,
  content?: string,                    // Alternative format (plain string)
  reply?: string | {                   // Alternative format
    content: string,
    attachments?: Array<{...}>
  },
  conversationId?: string | null,      // New conversation ID if created
  timestamp?: string,                  // ISO timestamp
  error?: string                       // Error message if failed
}
```

**Response Handling Code:**
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

**Streaming Response Format (SSE):**
```typescript
// SSE Events:
data: {"type": "conversationId", "conversationId": "uuid"}     // New conversation created
data: {"type": "status", "message": "Processing..."}           // Status update
data: {"type": "content", "delta": "chunk of text"}            // Content chunk
data: {"type": "attachments", "data": [...]}                    // Attachments array
data: {"type": "done", "full_response": "...", "latency_ms": 1234}  // Completion
data: {"type": "error", "message": "Error message"}           // Error
```

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should return one of these formats
- Backend should include `conversationId` if a new conversation was created
- Backend should handle attachments in the response
- Backend should return proper error format on failure

---

### Question 6: How is user authenticated end-to-end?

**Frontend Answer:**

1. **User logs in** via Supabase Auth
2. **Frontend gets JWT token:**
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

3. **Frontend sends token in Authorization header:**
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

4. **Backend validates token** (UNSURE - need backend confirmation)

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should validate the `Authorization: Bearer <token>` header
- Backend should extract `user_id` from the JWT token
- Backend should verify token hasn't expired
- Backend should use the `user_id` for:
  - Creating conversations
  - Saving messages
  - Enforcing RLS policies

---

### Question 7: What happens on save failure?

**Frontend Answer:**

**If Backend API Call Fails:**
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

**Frontend Behavior on Save Failure:**
- User message remains in UI (optimistic update)
- Assistant message is removed from UI
- System error message is shown to user
- User can retry via system message action
- Error is logged to Sentry
- **Frontend does NOT know if backend saved the message or not** - it trusts backend

**Backend Answer:** (UNSURE - need backend team confirmation)
- Backend should handle save failures gracefully
- Backend should retry failed saves (UNSURE - need confirmation)
- Backend should return error response if save fails
- Backend should log save failures
- Backend should NOT return success if save failed

---

## Architecture Flow Diagram

```
User clicks Send
       ↓
[Frontend: chat-input.tsx]
  - handleSubmit() called
  - Calls onSendMessage(trimmedMessage)
       ↓
[Frontend: use-message-handler.ts]
  - handleSendMessage() receives message
  - Checks if chat is loading (queues if yes)
  - Calls sendMessage() from use-chat
       ↓
[Frontend: use-chat.ts]
  - sendMessageStreaming() or sendMessage() called
  - Gets Supabase JWT token (session.access_token)
  - Creates user message object (optimistic update)
  - Adds user message to UI state immediately
  - Creates empty assistant message (optimistic update)
  - Adds assistant message to UI state immediately
       ↓
[Frontend: use-streaming-chat.ts OR direct fetch]
  - Calls Fly.io backend directly:
    POST https://pelican-backend.fly.dev/api/pelican_stream
    OR
    POST https://pelican-backend.fly.dev/api/pelican_response
  - Headers: Authorization: Bearer <supabase_jwt>
  - Body: { message, conversationId, conversationHistory, fileIds }
       ↓
[Backend: pelican-backend.fly.dev]
  - Validates JWT token (UNSURE - need confirmation)
  - Extracts user_id from token
  - If conversationId is null:
    → Creates new conversation in Supabase
    → Returns conversationId in response
  - Processes message (AI generation)
  - Saves user message to Supabase messages table (UNSURE - need confirmation)
  - Saves assistant reply to Supabase messages table (UNSURE - need confirmation)
  - Updates conversation metadata (updated_at, message_count) (UNSURE - need confirmation)
  - Returns response (streaming or JSON)
       ↓
[Frontend: Response Handling]
  - Streaming: Receives SSE chunks, updates assistant message in real-time
  - Non-streaming: Receives JSON, updates assistant message with full content
  - If conversationId returned and was null:
    → Updates currentConversationId state
    → Triggers onConversationCreated callback
  - Updates UI with final assistant message
       ↓
Message appears in UI
  ✅ User message: Already visible (optimistic update)
  ✅ Assistant message: Now visible with full content
       ↓
[Backend: Message Persistence]
  - Backend should have already saved messages to Supabase (UNSURE - need confirmation)
  - Backend should have updated conversation metadata (UNSURE - need confirmation)
       ↓
Message persisted to Supabase
  ✅ User message in messages table
  ✅ Assistant message in messages table
  ✅ Conversation updated_at timestamp updated
       ↓
[Frontend: Title Update (if first message)]
  - If messages.length <= 2:
    → Frontend calls PATCH /api/conversations/{id}
    → Updates title to first 50 chars of user message
    → Vercel API route updates Supabase conversations table
       ↓
User refreshes page
  - Frontend fetches conversation via SWR:
    GET /api/conversations/{id}
  - Vercel API route queries Supabase:
    SELECT * FROM conversations WHERE id = {id}
    JOIN messages ON conversation_id = {id}
  - Returns conversation with messages
       ↓
Message still there (or not?)
  ✅ If backend saved: Message appears in UI
  ❌ If backend failed to save: Message missing (only in UI state, lost on refresh)
  ⚠️  RISK: Frontend doesn't verify backend saved successfully
```

---

## Critical Gaps & Unknowns

### Frontend Assumptions (Need Backend Confirmation)

1. **Message Persistence:**
   - ❓ Does backend save messages synchronously before returning response?
   - ❓ Does backend save messages asynchronously (fire-and-forget)?
   - ❓ Does backend retry failed saves?
   - ❓ What happens if backend save fails but response succeeds?

2. **Conversation Creation:**
   - ❓ Does backend create conversation before or after processing message?
   - ❓ What happens if conversation creation fails?
   - ❓ Does backend return conversationId in response?

3. **Error Handling:**
   - ❓ Does backend return error response if save fails?
   - ❓ Does backend log save failures?
   - ❓ Does backend have retry logic for failed saves?

4. **Authentication:**
   - ❓ How does backend validate Supabase JWT?
   - ❓ What happens if token is invalid/expired?
   - ❓ Does backend extract user_id from token?

5. **Response Format:**
   - ❓ What exact format does backend return?
   - ❓ Does backend always include conversationId?
   - ❓ Does backend handle attachments in response?

### Potential Issues

1. **Race Condition:**
   - Frontend shows message in UI immediately (optimistic)
   - Backend may save asynchronously
   - User refreshes before backend saves → message lost

2. **No Save Verification:**
   - Frontend doesn't verify backend saved successfully
   - Frontend trusts backend response
   - If backend fails silently, frontend doesn't know

3. **Title Update Timing:**
   - Frontend updates title after message completes
   - If backend already set title, may conflict
   - No coordination between frontend and backend title updates

---

## Recommendations

1. **Backend should confirm save success in response:**
   ```typescript
   {
     conversationId: string,
     messageId: string,  // Add this
     saved: boolean,     // Add this
     // ... rest of response
   }
   ```

2. **Frontend should verify save on refresh:**
   - After message completes, wait a moment
   - Fetch conversation from DB
   - Verify message exists
   - Show warning if message missing

3. **Backend should return error if save fails:**
   - Don't return success if save failed
   - Return proper error response
   - Frontend can retry or show error

4. **Add save verification endpoint:**
   - `GET /api/messages/verify/{conversationId}/{messageId}`
   - Frontend can check if message was saved
   - Useful for debugging and recovery

---

## File References

### Frontend Files
- [`hooks/use-chat.ts`](Pelican-frontend/hooks/use-chat.ts) - Main message sending logic
- [`hooks/use-streaming-chat.ts`](Pelican-frontend/hooks/use-streaming-chat.ts) - Streaming message handling
- [`components/chat/chat-input.tsx`](Pelican-frontend/components/chat/chat-input.tsx) - Send button handler
- [`app/api/conversations/[id]/route.ts`](Pelican-frontend/app/api/conversations/[id]/route.ts) - Title update API

### Backend Files (Need Backend Team)
- `pelican-backend.fly.dev/api/pelican_response` - Non-streaming endpoint
- `pelican-backend.fly.dev/api/pelican_stream` - Streaming endpoint
- Backend message save logic
- Backend conversation creation logic
- Backend authentication validation

