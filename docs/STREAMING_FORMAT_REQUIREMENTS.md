# Frontend Streaming Format Requirements

## Quick Answers to Key Questions

### 1. What exact format does the frontend expect for streaming chunks?

The frontend expects **Server-Sent Events (SSE)** format with the `data: ` prefix.

**Format:**
```
data: {JSON_OBJECT}\n\n
```

### 2. Which format does the parser handle?

The frontend parser handles **TWO formats**:

#### Format A: OpenAI-style (Currently used by `/api/chat`)
```json
{
  "choices": [{
    "delta": {
      "content": "token text here"
    }
  }],
  "conversationId": "...",
  "timestamp": "..."
}
```

#### Format B: Simple Pelican format (Expected from `/api/pelican_stream`)
```json
{
  "content": "token text here"
}
```

#### Format NOT Supported: `{token: token}`
The frontend does NOT handle `{'token': token}` format. It expects either:
- `parsed.choices[0].delta.content` (OpenAI format)
- `parsed.content` (Simple format)

**Code Reference:**
```typescript
// Handles OpenAI format
if (parsed.choices?.[0]?.delta?.content) {
  streamingContent += parsed.choices[0].delta.content
}

// Handles simple Pelican format  
else if (parsed.content !== undefined) {
  streamingContent += parsed.content
}
```

### 3. Is the frontend set up for SSE (Server-Sent Events)?

✅ **YES** - The frontend is fully set up for SSE:

**Evidence:**
- Checks for `text/event-stream` content type: `if (contentType?.includes("text/event-stream"))`
- Uses `response.body.getReader()` to read the stream
- Parses lines starting with `data: `
- Handles `[DONE]` termination signal

**Code Location:** `Pelican-frontend/hooks/use-chat.ts` lines 163-267

### 4. Does it expect `data: ` prefix?

✅ **YES** - The frontend REQUIRES the `data: ` prefix

**Code:**
```typescript
if (line.startsWith("data: ")) {
  const data = line.slice(6)  // Removes "data: " prefix
  // ... parse JSON
}
```

**Expected format from backend:**
```
data: {"content": "token"}\n\n
```

### 5. Does it expect `[DONE]` signal?

✅ **YES** - The frontend expects `[DONE]` to signal stream completion

**Code:**
```typescript
if (data === "[DONE]") {
  break  // Stops reading stream
}
```

**Expected format:**
```
data: [DONE]\n\n
```

### 6. Debug Logging Added

✅ **Console logging has been added** to help debug:

**Location:** `Pelican-frontend/hooks/use-chat.ts` lines 210-212

```typescript
console.log('Raw chunk received:', data)
const parsed = JSON.parse(data)
console.log('Parsed chunk:', parsed)
```

This will show in the browser console:
- Raw SSE line (after removing `data: `)
- Parsed JSON object
- Which format path is taken

### 7. What format worked before the optimizations?

**OLD FORMAT (from `/api/chat` route):**

The `/api/chat` route used to transform backend chunks into OpenAI-style format:

```typescript
// Backend sends raw text chunk
const chunk = "token text"

// Next.js API transforms it to OpenAI format
const data = JSON.stringify({
  choices: [{
    delta: { content: chunk },
    finish_reason: null,
  }],
  conversationId: activeConversationId,
  timestamp: new Date().toISOString(),
})

// Sends as SSE
controller.enqueue(encoder.encode(`data: ${data}\n\n`))
```

**Final message format:**
```json
{
  "choices": [{
    "message": { "role": "assistant", "content": "full response" },
    "finish_reason": "stop"
  }],
  "conversationId": "...",
  "timestamp": "..."
}
```

**NEW FORMAT (from `/api/pelican_stream` route):**

The new route expects backend to send:
```json
{
  "content": "token text"
}
```

And forwards it directly with `data: ` prefix.

---

## Summary Table

| Requirement | Status | Details |
|------------|--------|---------|
| SSE Format | ✅ Required | Must use `data: ` prefix |
| Line Endings | ✅ Required | Must use `\n\n` after each event |
| `[DONE]` Signal | ✅ Required | Must send `data: [DONE]\n\n` at end |
| Content Format | ✅ Flexible | Supports both OpenAI and simple format |
| `{token: token}` | ❌ NOT Supported | Must use `{content: token}` or `{choices:[...]}` |

---

## Expected Stream Format

**Per chunk:**
```
data: {"content": "hello"}\n\n
data: {"content": " world"}\n\n
data: {"content": "!"}\n\n
```

**At completion:**
```
data: [DONE]\n\n
```

---

## Backend Requirements

For the backend to work with this frontend:

1. ✅ Send SSE format: `data: {JSON}\n\n`
2. ✅ Use `text/event-stream` content type
3. ✅ Include `data: ` prefix on each line
4. ✅ Send `data: [DONE]\n\n` at the end
5. ✅ Use format: `{"content": "token"}` OR `{"choices": [{"delta": {"content": "token"}}]}`

---

## Testing

To verify the format is correct:

1. Open browser DevTools Console
2. Send a chat message
3. Look for console logs:
   - `Raw chunk received: {...}`
   - `Parsed chunk: {...}`
4. Verify which parsing path is taken:
   - `choices[0].delta.content` path
   - OR `content` path

