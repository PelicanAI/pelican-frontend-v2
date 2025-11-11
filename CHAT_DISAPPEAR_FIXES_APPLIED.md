# Chat Disappears After Message - Fixes Applied

## Summary
Applied comprehensive debugging and error handling improvements to track and prevent conversations from disappearing after a message response from the server.

## Files Modified

### 1. **app/chat/page.tsx**
**Changes**: Added handling for `conversationNotFound` state

```diff
- const {
-   messages,
-   isLoading: chatLoading,
-   ...
- } = useChat({

+ const {
+   messages,
+   isLoading: chatLoading,
+   conversationNotFound,  // ← NEW
+   ...
+ } = useChat({
```

**Added useEffect**: 
- Listens for `conversationNotFound` becoming true
- Logs error to console
- Redirects to `/chat` (new conversation page)

### 2. **hooks/use-chat.ts**
**Changes**: Enhanced error handling and logging

1. Added Sentry error capture when conversation fetch returns 404/403:
```typescript
captureCriticalError(conversationError, {
  location: "api_call",
  endpoint: `/api/conversations/${currentConversationId}`,
  conversationId: currentConversationId,
})
```

2. Enhanced streaming error handler with detailed logging:
   - Added `conversationId`, `messageLength`, `errorMessage` to logs
   - Captures error in Sentry with full context
   - Maintains existing user-friendly error messages

### 3. **hooks/use-streaming-chat.ts**
**Changes**: Added console logging for stream errors

```typescript
case 'error':
  console.error('[STREAMING] Error event from backend:', event.message);
  callbacks.onError?.(event.message || 'Unknown error');
  break;
```

### 4. **app/api/pelican_response/route.ts**
**Changes**: Comprehensive logging for response handling

**Success logging**:
```typescript
logger.info("Received Pelican API response", {
  conversationId: activeConversationId,
  userId: effectiveUserId,
  responseLength: reply.length,
  hasAttachments: attachments.length > 0,
  attachmentCount: attachments.length,
  dataKeys: Object.keys(data),  // ← NEW: See all response fields
})

console.log('[PELICAN_RESPONSE] Successfully processed API response', {
  conversationId: activeConversationId,
  replyLength: reply.length,
  hasAttachments: attachments.length > 0,
  timestamp: new Date().toISOString()
})
```

**Error logging**:
```typescript
console.error('[PELICAN_RESPONSE] API Error', {
  conversationId: activeConversationId,
  userId: effectiveUserId,
  errorMessage: error instanceof Error ? error.message : String(error),
  errorName: error instanceof Error ? error.name : 'Unknown',
  timestamp: new Date().toISOString()
})

Sentry.captureException(error, {
  tags: { endpoint: '/api/pelican_response', error_location: 'api_handler' },
  extra: { conversationId: activeConversationId, userId: effectiveUserId }
})
```

### 5. **app/api/chat/route.ts**
**Changes**: Comprehensive logging for response handling

Same structure as `pelican_response/route.ts`:
- Added `[CHAT_RESPONSE]` console logs
- Added Sentry error capture
- Added detailed error context

## What These Changes Do

### 1. **Conversation Not Found Handling**
- When a conversation is deleted or access is denied (404/403)
- User is immediately redirected to `/chat` instead of stuck on blank page
- Error is logged to console and Sentry

### 2. **Streaming Error Capture**
- Backend errors in `/api/pelican_stream` are now captured in Sentry
- Error events from SSE stream are logged to console
- User gets a friendly error message with retry option

### 3. **API Response Logging**
- Can see all fields returned by backend API in logs (`dataKeys`)
- Successful responses logged with timestamp and details
- Can verify conversation ID and content length

### 4. **Error Details in Sentry**
- All errors tagged with endpoint and location
- Extra context includes conversationId, userId, messageLength
- Can filter by error_location to find specific issue types

### 5. **Console Debug Logs**
- `[PELICAN_RESPONSE]` messages for direct API calls
- `[CHAT_RESPONSE]` messages for chat endpoint calls
- `[STREAMING]` messages for streaming events
- Timestamps for correlating with server logs

## How to Use

### During Development
1. Open browser DevTools Console
2. Send a message in chat
3. Look for `[PELICAN_RESPONSE] Successfully processed API response` or error message
4. If error, it will show the exact error with timestamp

### For Bug Investigation
1. When issue occurs, check browser console for error
2. Check Sentry dashboard: filter by endpoint and timestamp
3. Check Fly.io backend logs: `fly logs -a pelican-backend`
4. Correlate timestamps to understand the failure sequence

### Testing
Use the comprehensive debugging guide in `CHAT_DISAPPEAR_DEBUG_GUIDE.md`

## Expected Behavior After Fixes

### Success Case
```
User sends message
↓
[PELICAN_RESPONSE] Successfully processed API response (logs to console)
↓
Message appears in chat
↓
No redirect, conversation remains visible
```

### Error Case (Conversation Not Found)
```
User sends message
↓
API returns 404/403
↓
Sentry captures error with tags and context
↓
Console logs: [CHAT] Conversation not found: {id}
↓
User redirected to /chat (new conversation)
↓
Error message displayed to user
```

### Error Case (API Failure)
```
User sends message
↓
API returns error
↓
[PELICAN_RESPONSE] API Error logged to console
↓
Sentry captures error with full context
↓
Error message shown to user
↓
User can retry with retry button
```

## Sentry Tags for Filtering

### Find All Pelican Response Errors
```
endpoint:/api/pelican_response AND error_location:api_handler
```

### Find All Streaming Errors
```
error_location:streaming
```

### Find Conversation Not Found Errors
```
endpoint:/api/conversations/
```

### Find All API Call Failures
```
error_location:api_call
```

## Database Verification

If issue still occurs, verify in Supabase:

```sql
-- Check if conversation exists
SELECT id, user_id, title, created_at FROM conversations 
WHERE id = '{conversation_id}' LIMIT 1;

-- Check if messages were saved
SELECT id, role, content, created_at FROM messages 
WHERE conversation_id = '{conversation_id}' 
ORDER BY created_at DESC;

-- Check if embeddings were created
SELECT id, message_id, created_at FROM memory_embeddings 
WHERE user_id = '{user_id}' 
ORDER BY created_at DESC LIMIT 10;
```

## Next Phase

Once these logging improvements are deployed:

1. **Monitor Sentry** for patterns in errors
2. **Analyze logs** to find root cause:
   - Is conversation being deleted?
   - Is fetch returning 404?
   - Is streaming failing?
   - Is response malformed?
3. **Implement permanent fix** based on findings
4. **Add regression tests** for the specific scenario

## Files with Debug Guides

- `CHAT_DISAPPEAR_DEBUG_GUIDE.md` - Comprehensive debugging procedures
- `CHAT_DISAPPEAR_FIXES_APPLIED.md` - This file, documenting changes

