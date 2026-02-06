# Chat Disappears After Message Response - Debugging Guide

## Issue Description
When a message is answered in the frontend from the server, the entire chat page goes back to home and the conversation deletes or disappears.

## Root Cause Analysis

The issue is likely one of these:

1. **Conversation Not Found Error (404/403)**: The conversation is deleted or access is denied
   - Frontend redirects to `/chat` when `conversationNotFound` is true
   - Added in `app/chat/page.tsx` useEffect hook

2. **Streaming Error Not Captured**: Error in `/api/pelican_stream` endpoint
   - Backend returns error but frontend doesn't properly handle it
   - Error logs now captured in Sentry and console

3. **API Response Parsing Error**: Response format doesn't match expected structure
   - Added detailed logging to see raw response structure
   - Check `dataKeys` in logs to see what fields are returned

4. **Supabase Conversation Fetch Error**: Cannot fetch conversation from database
   - SWR is configured with `dedupingInterval: 5000`
   - Check if conversation exists in database

## Fixes Applied

### 1. Chat Page (`app/chat/page.tsx`)
- ✅ Added `conversationNotFound` to destructuring from useChat hook
- ✅ Added useEffect to handle `conversationNotFound` state
- ✅ Redirects to `/chat` with console error logging when conversation not found

### 2. Use Chat Hook (`hooks/use-chat.ts`)
- ✅ Added Sentry error capture when conversation fetch returns 404/403
- ✅ Improved error logging context with endpoint and conversationId
- ✅ Enhanced streaming error handler with detailed logging
- ✅ Added logging for critical streaming errors in Sentry

### 3. Use Streaming Chat (`hooks/use-streaming-chat.ts`)
- ✅ Added console.error logging for error events from backend
- ✅ Better error tracking when SSE stream returns error type

### 4. Pelican Response API (`app/api/pelican_response/route.ts`)
- ✅ Added `dataKeys` logging to see all fields in API response
- ✅ Added console.log for successful response handling
- ✅ Added console.error for all error cases
- ✅ Added Sentry error capture for API errors
- ✅ Better error context and debugging information

### 5. Chat API (`app/api/chat/route.ts`)
- ✅ Added console.log for successful response handling
- ✅ Added console.error for all error cases
- ✅ Added Sentry error capture for API errors
- ✅ Better error context

## How to Debug

### Step 1: Check Browser Console
When the issue occurs, check the browser developer console for:
- `[CHAT] Conversation not found:` - Conversation fetch returned 404/403
- `[STREAMING] Error event from backend:` - Backend sent error in stream
- `[PELICAN_RESPONSE] Successfully processed API response` - Confirms response was processed
- `[PELICAN_RESPONSE] API Error` - Shows what went wrong in API call
- `[CHAT_RESPONSE]` messages - Shows debug logs from chat endpoint

### Step 2: Check Network Tab
- Look for the request to `/api/pelican_response` or `/api/chat`
- Check response status code (should be 200 if successful)
- Check response body for any error fields

### Step 3: Check Sentry Dashboard
- Go to https://sentry.io
- Filter by endpoint: `/api/pelican_response`, `/api/chat`, or `/api/pelican_stream`
- Look for:
  - `error_location: 'api_call'` (API errors)
  - `error_location: 'authentication'` (Auth errors)
  - `error_location: 'api_handler'` (Handler errors)
  - `error_location: 'streaming'` (Stream errors)
- Check the extra context which includes conversationId and userId

### Step 4: Check Backend Logs
```bash
fly logs -a pelican-backend
```

Look for:
- `[PELICAN] Pelican instance created successfully` - Backend started
- `INFO:script_analysis_engine` - Request being processed
- Any error messages during processing
- `INFO:httpx:HTTP Request` - Outgoing requests to other services

### Step 5: Check Database
Query Supabase to verify:
- Conversation exists: `SELECT * FROM conversations WHERE id = '{conversation_id}'`
- Messages were saved: `SELECT * FROM messages WHERE conversation_id = '{conversation_id}'`
- Message embeddings created: `SELECT * FROM memory_embeddings WHERE user_id = '{user_id}'`

## Common Issues & Solutions

### Issue: Conversation returns 404
**Solution**: Check if conversation exists in database
```sql
SELECT id, user_id, created_at FROM conversations ORDER BY created_at DESC LIMIT 10
```

### Issue: "No response received"
**Solution**: Backend returned empty reply field
- Check backend logs for what was processed
- Backend might have returned `{ "reply": null }` or `{ "reply": "" }`
- Response parsing in `pelican_response/route.ts` handles this with fallback

### Issue: Streaming timeout
**Solution**: Request took too long (>30 seconds)
- Check backend for long-running operations
- Market data loading can take time
- Conversation history retrieval might be slow

### Issue: Authentication error
**Solution**: Session token might be invalid
- Check if user is still authenticated
- Session might have expired
- Browser may have cleared Supabase session

## Testing

### Test Case 1: Basic Message
1. Navigate to `/chat`
2. Send: "Hello"
3. Verify: Message appears and response comes back
4. Verify: Conversation ID in URL doesn't change
5. Check logs for `[PELICAN_RESPONSE] Successfully processed API response`

### Test Case 2: Complex Query
1. Send: "What stocks should I look at?"
2. Verify: Longer response processes correctly
3. Check: Market data loading happens successfully
4. Verify: No redirect to home

### Test Case 3: Error Handling
1. Send: "test" message
2. Manually trigger an error by killing backend (for testing)
3. Verify: Error message appears to user (not redirect to home)
4. Check Sentry for error capture
5. Verify: User can retry the message

### Test Case 4: Long Streaming
1. Send a query that triggers streaming
2. Verify: Messages stream in correctly
3. Verify: No premature redirect or deletion
4. Check logs for streaming events

## Monitoring

### Key Metrics to Watch
1. **Error Rate**: Track errors in `/api/pelican_response` and `/api/chat`
2. **Conversation Creation Rate**: Monitor new conversation creation
3. **Response Time**: Track latency from message send to response received
4. **Streaming Success Rate**: Monitor SSE stream completion

### Sentry Alerts to Create
- Alert on critical errors with `error_location: 'api_handler'`
- Alert on conversation not found errors (404/403)
- Alert on streaming errors from backend
- Alert when response parsing fails

## Environment Variables

Verify these are set:
- `NEXT_PUBLIC_BACKEND_URL` - Points to Pelican backend
- `PEL_API_KEY` - Backend API key
- `PEL_API_URL` - Backend URL (same as NEXT_PUBLIC_BACKEND_URL)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking

## Related Files

- `hooks/use-chat.ts` - Main chat logic, conversation management
- `hooks/use-streaming-chat.ts` - Streaming response handling
- `hooks/use-conversation-router.ts` - Conversation navigation
- `app/api/pelican_response/route.ts` - Response endpoint (direct API call)
- `app/api/chat/route.ts` - Chat endpoint (streaming capable)
- `app/chat/page.tsx` - Main chat UI page
- `lib/sentry-utils.ts` - Sentry error capture utilities
- `lib/logger.ts` - Logging utilities

## Next Steps

1. Test the fixes with the new logging in place
2. Monitor Sentry dashboard for patterns
3. Check browser console during issue reproduction
4. Verify conversation exists in database after message send
5. Check if it's specific to certain types of queries (market data vs simple questions)
6. Test with different conversation types (new vs existing)

## Questions to Answer

1. Does the conversation actually get deleted from the database?
2. Or does it just disappear from the UI while existing in the database?
3. Does the error appear in Sentry logs?
4. What's the exact flow: send message → response starts → what happens next?
5. Is the issue specific to streaming or non-streaming responses?
6. Does it happen for all messages or only specific ones?

