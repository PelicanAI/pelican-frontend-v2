# Chat Disappears Issue - Reproduction & Verification Steps

## Goal
Reproduce the issue where chat goes back to home after a message response, and verify the fixes are working.

## Prerequisites
- Browser with DevTools open (F12)
- Sentry dashboard open in another tab
- Fly.io logs open in terminal: `fly logs -a pelican-backend`

## Setup

### 1. Open DevTools
1. Press F12 to open DevTools
2. Go to Console tab
3. Set log level to verbose (filter = no filters)

### 2. Open Sentry Dashboard
1. Navigate to https://sentry.io
2. Select Pelican-Chat project
3. Keep Sentry open to watch for errors in real-time

### 3. Start Backend Logs
```bash
cd pelican_backend
fly logs -a pelican-backend
```

### 4. Access Chat Page
1. Navigate to https://pelican-chat.com/chat (or local equivalent)
2. Authenticate as test user
3. Verify you're on the chat page with a conversation ID

## Reproduction Attempt 1: Normal Message

### Steps
1. Send message: "Hello, what's your name?"
2. Wait for response
3. Observe behavior

### What Should Happen (After Fixes)
1. Message appears in chat
2. AI responds
3. Console shows: `[PELICAN_RESPONSE] Successfully processed API response`
4. No redirect to home
5. Conversation ID stays the same in URL

### What We're Looking For (If Bug Occurs)
1. Console shows: `[CHAT] Conversation not found: {id}`
2. Page redirects to `/chat` (loses conversation ID)
3. Chat history disappears
4. Sentry shows error with `error_location: 'api_call'`

### Verification Checklist
- [ ] Message appeared in chat
- [ ] AI response was generated
- [ ] `[PELICAN_RESPONSE] Successfully processed API response` in console
- [ ] Conversation ID in URL unchanged
- [ ] No errors in Sentry
- [ ] Backend logs show successful response

---

## Reproduction Attempt 2: Complex Query

### Steps
1. Send message: "What stocks should I analyze right now? Show me QQQ analysis."
2. Wait for streaming/response (may take 10-30 seconds)
3. Observe behavior closely

### What Should Happen
1. Market data starts loading
2. Messages stream in (or appear after completion)
3. Console shows: `[PELICAN_RESPONSE] Successfully processed API response`
4. Response appears fully in chat
5. No redirect

### What We're Looking For (If Bug Occurs)
1. Response starts but then disappears
2. Chat redirects to home mid-response
3. Console shows streaming error: `[STREAMING] Error event from backend:`
4. Sentry captures error with `error_location: 'streaming'`

### Verification Checklist
- [ ] Market data loaded successfully
- [ ] Full response appeared
- [ ] `[PELICAN_RESPONSE]` log present
- [ ] No redirect mid-response
- [ ] Conversation persists
- [ ] No errors in Sentry

---

## Reproduction Attempt 3: Simulate Network Error

### Steps
1. Open DevTools → Network tab
2. Set throttling: "Slow 3G"
3. Send message: "Hello"
4. Quickly turn off network: DevTools → Network → Offline
5. Wait 5 seconds
6. Turn network back on: Online
7. Observe behavior

### What Should Happen
1. User sees offline banner (already implemented)
2. When network returns, message is retried or shows error
3. If error, shows: `Network error. Please check your internet connection and try again.`
4. Retry button available
5. Conversation remains on screen

### What We're Looking For (If Bug Occurs)
1. Conversation disappears completely
2. Redirects to home without explanation
3. Console shows network error
4. No error message to user about network

### Verification Checklist
- [ ] Offline banner appeared
- [ ] Message sent (or retry option appeared)
- [ ] Conversation visible after network recovered
- [ ] Helpful error message shown (not blank redirect)

---

## Reproduction Attempt 4: Check Conversation Not Found

### Steps (Requires Database Access)
1. Send a message and get a conversation ID from URL
2. Copy the conversation ID
3. Go to Supabase database
4. Delete the conversation: `DELETE FROM conversations WHERE id = '{id}'`
5. Go back to browser, in the same chat tab
6. Try to send another message
7. Observe behavior

### What Should Happen (After Fixes)
1. API call returns 404
2. Console shows: `[CHAT] Conversation not found: {id}`
3. Browser redirects to `/chat` (clean URL, no conversation param)
4. Starts a new conversation
5. Sentry shows 404 error with proper tags

### Previous Behavior (Before Fixes)
- Chat disappears without explanation
- Conversation ID gone from URL
- No error message
- Unclear what happened to user

### Verification Checklist
- [ ] 404 error logged to Sentry
- [ ] Console shows `[CHAT] Conversation not found:`
- [ ] Redirected to `/chat` (no conversation param)
- [ ] New conversation created
- [ ] Error tagged with `error_location: 'api_call'`

---

## Monitoring During Tests

### Console Patterns to Look For

**Success Pattern**:
```
[PELICAN_RESPONSE] Successfully processed API response {
  conversationId: "conv_xxx",
  replyLength: 250,
  hasAttachments: false,
  timestamp: "2025-11-11T20:30:45.123Z"
}
```

**Error Pattern**:
```
[PELICAN_RESPONSE] API Error {
  conversationId: "conv_xxx",
  userId: "user_xxx",
  errorMessage: "API request failed with status 500",
  errorName: "Error",
  timestamp: "2025-11-11T20:30:45.123Z"
}
```

**Streaming Error Pattern**:
```
[STREAMING] Error event from backend: Backend error message
```

**Conversation Not Found Pattern**:
```
[CHAT] Conversation not found: conv_xxx
```

### Sentry Patterns to Look For

Filter: `endpoint:/api/pelican_response`

**Success**: No errors in Sentry

**Error**: Look for these tags:
- `error_location: 'api_handler'` - Server error occurred
- `error_location: 'api_call'` - Conversation fetch failed
- `error_location: 'streaming'` - Streaming/SSE error

Click on error to see:
- Exact error message
- Extra context: conversationId, userId
- Stack trace if applicable

### Backend Log Patterns

**Success**:
```
INFO:app.main:[REQUEST] POST /api/pelican_response
INFO:pelican_v52:[METRICS] Rounds: 1, Tools: 2, Cache hits: 0
INFO:app.main:[RESPONSE] POST /api/pelican_response - 200 - 28.97s
```

**Error**:
```
ERROR:app.main:Something went wrong
ERROR:pelican_v52:Failed to process message
```

---

## Detailed Issue Analysis

If you find errors, analyze them:

### Step 1: Identify Error Type
```
[CHAT] Conversation not found?
  → Conversation doesn't exist in database
  → Go to Supabase and check

[STREAMING] Error event?
  → Backend SSE stream failed
  → Check backend logs for error

[PELICAN_RESPONSE] API Error?
  → Our API call to Pelican backend failed
  → Check errorMessage in console for details

Network error?
  → Connection to backend failed
  → Check browser Network tab for status code
```

### Step 2: Check Database
```sql
-- Is conversation in database?
SELECT id FROM conversations WHERE id = '{id}';

-- Are messages saved?
SELECT COUNT(*) FROM messages WHERE conversation_id = '{id}';

-- When was last message created?
SELECT MAX(created_at) FROM messages WHERE conversation_id = '{id}';
```

### Step 3: Check Sentry
1. Filter by timestamp of error (when you sent the message)
2. Filter by endpoint (`/api/pelican_response` or `/api/chat`)
3. Look at extra context
4. Read error message carefully

### Step 4: Check Backend
```bash
fly logs -a pelican-backend | grep -A5 -B5 "error"
```

---

## Test Results Template

Copy and fill this out when testing:

```
### Test Date: [DATE]

#### Test 1: Normal Message
- Message sent: "Hello, what's your name?"
- Expected: [✓ Pass / ✗ Fail]
- Actual: [Describe what happened]
- Console logs: [Copy relevant logs]
- Sentry errors: [Yes/No]
- Notes: [Any observations]

#### Test 2: Complex Query
- Message sent: "Market analysis of QQQ"
- Expected: [✓ Pass / ✗ Fail]
- Actual: [Describe what happened]
- Response time: [X seconds]
- Sentry errors: [Yes/No]
- Notes: [Any observations]

#### Test 3: Network Error
- Network condition: [Slow 3G / Offline]
- Expected: [✓ Pass / ✗ Fail]
- Error message shown: [Yes/No - what was it?]
- Sentry errors: [Yes/No]
- Notes: [Any observations]

#### Test 4: Conversation Not Found
- Database action: [Deleted conversation]
- Expected: [✓ Pass / ✗ Fail]
- Error shown: [Conversation not found / blank page]
- Redirected to: [/chat or stayed same page]
- Sentry errors: [Yes/No]
- Notes: [Any observations]

#### Summary
- All tests passed: [✓ Yes / ✗ No]
- Any new issues found: [List them]
- Ready to deploy: [✓ Yes / ✗ No]
```

---

## Success Criteria

All of these should be true after fixes are deployed:

1. ✅ Normal messages work without redirect
2. ✅ Complex queries complete without disappearing
3. ✅ Network errors show helpful message, not blank redirect
4. ✅ Conversation not found shows error and redirects cleanly
5. ✅ All errors appear in Sentry with proper context
6. ✅ Console has helpful debug logs
7. ✅ Conversation persists after message response
8. ✅ User never sees blank chat screen without explanation
9. ✅ Error messages are user-friendly
10. ✅ Backend logs show successful processing

---

## Troubleshooting If Tests Fail

### If redirect still happens:
1. Check browser console for `[CHAT] Conversation not found:` message
2. Check Sentry for 404 errors on conversation fetch
3. Verify conversation exists in database
4. Check if user has permission to access conversation

### If no console logs appear:
1. Verify console filters are correct
2. Refresh page with DevTools open
3. Check if `USE_STREAMING` is set correctly in `use-chat.ts`
4. Try sending message and watching console in real-time

### If Sentry shows no errors:
1. Verify Sentry DSN is configured
2. Check Sentry filters (project, environment)
3. Make sure error is actually happening
4. Check if error is being filtered somewhere

### If backend logs are empty:
1. Verify `fly logs` command is running for correct app
2. Check if backend is actually receiving requests (check Network tab)
3. Verify backend URL is correct in environment variables
4. Check firewall/network connectivity to backend

---

## Additional Notes

- Tests should be run in clean browser session (no cached data)
- Use different test accounts if possible to verify multi-user behavior
- Test on both light and dark themes
- Test on mobile and desktop viewports
- Results may vary based on backend load/performance

