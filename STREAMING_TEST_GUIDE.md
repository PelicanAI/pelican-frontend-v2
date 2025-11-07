# Frontend Streaming Implementation Testing Guide

## Implementation Status

### ✅ Completed Components

1. **SSE Parser Utility** (`lib/sse-parser.ts`)
   - Parses Server-Sent Events from ReadableStream
   - Handles `data: {json}\n\n` format
   - Yields structured SSEMessage objects

2. **Streaming Chat Hook** (`hooks/use-streaming-chat.ts`)
   - Manages streaming state and abort controllers
   - POSTs to `/api/pelican_stream` endpoint
   - Handles all 5 event types: status, content, attachments, done, error

3. **Updated use-chat Hook** (`hooks/use-chat.ts`)
   - Added `USE_STREAMING = false` feature flag
   - Dual-mode support (streaming/non-streaming)
   - Seamless switching based on feature flag

4. **Streaming API Route** (`app/api/pelican_stream/route.ts`)
   - Proxies to backend streaming endpoint
   - Returns Server-Sent Events with proper headers
   - Handles conversation creation and database updates

5. **Test Page** (`app/test-streaming/page.tsx`)
   - Standalone testing interface
   - Console logging for all events
   - Cancel functionality

## Testing Procedure

### Step 1: Verify Non-Breaking Changes (Feature Flag OFF)

**Current Status:** `USE_STREAMING = false` (default)

```bash
# Start the frontend
npm run dev
```

**Tests to run:**
- [ ] Open chat at `http://localhost:3000/chat`
- [ ] Send: "What's AAPL at?"
  - Expected: Full response appears after delay (existing behavior)
- [ ] Send: "Show me top gainers"
  - Expected: Works exactly as before
- [ ] Check console for any errors
- [ ] Verify conversation history loads correctly

**✅ Pass Criteria:** All existing functionality works unchanged

### Step 2: Test Streaming Endpoint Directly

**Prerequisites:**
- [ ] Backend running on `http://localhost:8000`
- [ ] Backend has `/api/pelican_stream` endpoint available

**Test Page:** `http://localhost:3000/test-streaming`

**Tests to run:**
1. [ ] Send simple query: "What's AAPL at?"
   - Watch console for event sequence
   - Verify content streams progressively

2. [ ] Send complex query: "Show me tick data for SPY from 14:00-14:30"
   - Check for status events
   - Verify attachments if returned

**Expected Console Output:**
```
[Test] Streaming started
[Test] Status: Analyzing market data...
[Test] Chunk: Apple
[Test] Chunk:  Inc
[Test] Chunk: .
[Test] Complete: { fullResponse: "Apple Inc. (AAPL)...", latency: 2341 }
```

### Step 3: Enable Streaming in Main Chat

**Edit `hooks/use-chat.ts`:**
```typescript
const USE_STREAMING = true;  // ← Change this
```

**Restart dev server and test:**

1. [ ] Simple Query Test
   - Send: "What's AAPL at?"
   - Verify:
    - [ ] Empty message bubble appears immediately
    - [ ] Streaming indicator shows plain text "Generating response..."
    - [ ] Text appears word-by-word
    - [ ] Indicator disappears when complete

2. [ ] Complex Query Test
   - Send: "Why is NVDA moving today?"
   - Verify:
     - [ ] Status updates appear (if implemented in UI)
     - [ ] Content streams after tools complete
     - [ ] No UI glitches or errors

3. [ ] Multi-Message Test
   - Send multiple messages in succession
   - Verify each streams independently
   - Check conversation history updates correctly

### Step 4: Test Cancel Functionality

While streaming:
- [ ] Cancel button appears (if implemented)
- [ ] Clicking cancel stops the stream
- [ ] Partial content is preserved
- [ ] Can send new message immediately

### Step 5: Test Error Handling

1. [ ] Stop backend server
2. [ ] Send message
3. [ ] Verify error displays gracefully
4. [ ] Restart backend
5. [ ] Verify recovery works

## Common Issues & Solutions

### Issue: CORS or "Failed to fetch"
```bash
# Ensure backend allows frontend origin
# Check backend CORS settings
```

### Issue: Content appears all at once
Check:
- `USE_STREAMING = true` in use-chat.ts
- Backend returns `text/event-stream` content type
- SSE parser is parsing chunks correctly

### Issue: Streaming indicator stuck
Verify:
- `done` event sets `isStreaming: false`
- MessageBubble receives updated `isStreaming` prop

## Performance Validation

### Metrics to Track:
- **Non-streaming:** Time to first content (5-10s typical)
- **Streaming:** Time to first chunk (2-3s expected)
- **Perceived improvement:** ~40% reduction in wait time

### Quick Browser Console Test:
```javascript
// Verify streaming endpoint
fetch('/api/pelican_stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What's AAPL at?",
    conversationHistory: []
  })
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  function read() {
    reader.read().then(({ done, value }) => {
      if (done) {
        console.log('Stream complete');
        return;
      }
      console.log('Chunk:', decoder.decode(value));
      read();
    });
  }
  
  read();
});
```

## Final Checklist

Before marking as complete:

- [ ] Non-streaming mode works (flag OFF)
- [ ] Streaming mode works (flag ON)
- [ ] No console errors during normal use
- [ ] UI indicators work correctly
- [ ] Cancel functionality works (if implemented)
- [ ] Error states handled gracefully
- [ ] Performance improvement visible
- [ ] Conversation history updates correctly
- [ ] Attachments render properly (if returned)

## Roll-out Plan

1. **Current:** `USE_STREAMING = false` (safe default)
2. **Testing:** Use test page for validation
3. **Internal:** Enable for dev team
4. **Gradual:** A/B test with users
5. **Full:** Enable for all users

## Notes

- Streaming is purely additive - no breaking changes
- Feature flag allows instant rollback if needed
- Backend must support `/api/pelican_stream` endpoint
- All error handling maintains graceful degradation
