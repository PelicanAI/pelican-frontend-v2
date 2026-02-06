# File Upload Debug Guide

## 🎯 Flow Overview

1. **User selects file** → Chat input component
2. **File uploads to Supabase** → `/api/upload` route
3. **File metadata stored** → `useFileUpload` hook stores `fileId`
4. **User sends message** → `fileIds` included in request
5. **Backend receives** → Should fetch files by ID and process

---

## 📁 Key Code Files

### 1. Chat Input Component (File Selection)
**File:** `components/chat/chat-input.tsx`
- Handles file selection via `<input type="file">`
- Calls `onFileUpload` with File objects
- Shows preview of uploaded files

```254:260:components/chat/chat-input.tsx
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (files && files.length > 0 && onFileUpload) {
    onFileUpload(Array.from(files))
  }
  e.target.value = ""
}
```

### 2. File Upload Hook (Upload Logic)
**File:** `hooks/use-file-upload.ts`
- Handles file validation
- Uploads to `/api/upload` via FormData
- Stores uploaded file metadata with `id`, `url`, `name`, `type`
- Returns `getUploadedFileIds()` to get file IDs

```26:109:hooks/use-file-upload.ts
const handleFileUpload = useCallback(
  async (file: File) => {
    // Validation...
    const formData = new FormData()
    formData.append("file", file)
    
    const response = await fetch(API_ENDPOINTS.UPLOAD, {
      method: "POST",
      body: formData,
    })
    
    const { id: fileId, url, name, type, size } = await response.json()
    
    // Store uploaded file info - DON'T auto-send
    setUploadedFiles((prev) => [...prev, { id: fileId, type, name, url }])
    // ...
  },
  [sendMessage, addSystemMessage, chatInputRef],
)
```

**Key functions:**
- `getUploadedFileIds()` - Returns array of file IDs
- `getUploadedAttachments()` - Returns array of attachment objects
- `clearUploadedFiles()` - Clears after sending

### 3. Upload API Route (Backend Upload)
**File:** `app/api/upload/route.ts`
- Receives FormData with file
- Validates file type and size (15MB max)
- Uploads to Supabase Storage
- Saves metadata to `files` table
- Returns: `{ id, url, name, type, size, checksum }`

```79:221:app/api/upload/route.ts
const formData = await request.formData()
const file = formData.get("file") as File

// Validation...
const fileBuffer = await file.arrayBuffer()

// Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("pelican")
  .upload(storageKey, fileBuffer, {...})

// Save metadata to database
const { data: fileRecord, error: dbError } = await supabase
  .from("files")
  .insert({...})
  .select()
  .single()

return NextResponse.json({
  id: fileId,
  url: signedUrlData.signedUrl,
  name: file.name,
  type: file.type,
  size: file.size,
})
```

### 4. Chat Page (Orchestrates Send)
**File:** `app/chat/page.tsx`
- Connects file upload to message sending
- Gets fileIds when user clicks send
- Passes fileIds to `sendMessage`

```187:200:app/chat/page.tsx
const handleSendMessageWithFiles = useCallback(async (message: string) => {
  // Get uploaded file IDs and attachments
  const fileIds = fileUpload.getUploadedFileIds()
  const attachments = fileUpload.getUploadedAttachments()
  
  // Send message with files
  await messageHandler.handleSendMessage(message, { 
    fileIds: fileIds.length > 0 ? fileIds : undefined,
    attachments: attachments.length > 0 ? attachments : undefined
  })
  
  // Clear uploaded files after sending
  fileUpload.clearUploadedFiles()
}, [fileUpload, messageHandler])
```

### 5. Message Handler (Passes to Chat Hook)
**File:** `hooks/use-message-handler.ts`
- Receives fileIds from chat page
- Passes to `sendMessage` from `use-chat.ts`

```29:46:hooks/use-message-handler.ts
const handleSendMessage = useCallback(
  async (content: string, options?: { forceQueue?: boolean; fileIds?: string[]; attachments?: any[] }) => {
    // ...
    await sendMessage(content, { 
      fileIds: options?.fileIds, 
      attachments: options?.attachments 
    })
  },
  [chatLoading, currentConversationId, sendMessage, chatInputRef],
)
```

### 6. Chat Hook (Sends to Backend)
**File:** `hooks/use-chat.ts`
- **NON-STREAMING:** Sends directly to Fly.io backend
- **STREAMING:** Uses streaming hook
- Includes `fileIds` in request body

**Non-streaming path:**
```254:261:hooks/use-chat.ts
body: JSON.stringify({
  message: userMessage.content,
  conversationId: currentConversationId,
  conversationHistory: conversationHistory,
  conversation_history: conversationHistory,
  fileIds: options.fileIds,
}),
```

**Streaming path:**
```57:66:hooks/use-streaming-chat.ts
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

### 7. API Routes (Next.js → Backend Proxy)
**Files:** 
- `app/api/chat/route.ts` (legacy, may not be used)
- `app/api/pelican_response/route.ts` (may not be used - direct calls now)
- `app/api/pelican_stream/route.ts` (may not be used - direct calls now)

**Note:** The code shows direct calls to Fly.io backend:
```244:262:hooks/use-chat.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev'

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
      conversation_history: conversationHistory,
      fileIds: options.fileIds,
    }),
  })
})
```

---

## 🔍 How Files Are Sent

### Format: **fileIds Array in JSON Body**

Files are NOT sent as base64 or FormData with the message. Instead:

1. **File upload happens first** → `/api/upload` returns `fileId`
2. **FileId stored in state** → `useFileUpload` hook
3. **When sending message** → Only `fileIds: string[]` is included in JSON body
4. **Backend receives fileIds** → Should fetch files from database/storage by ID

### Example Request Body:
```json
{
  "message": "Analyze this image",
  "conversationId": "conv-123",
  "conversationHistory": [...],
  "fileIds": ["file-uuid-1", "file-uuid-2"]
}
```

---

## 🐛 Potential Crash Points

### 1. **Client-Side Before Request Fires**
- ❌ **`fileIds` might be undefined/null instead of empty array**
  - Check: `hooks/use-chat.ts` line 259
  - Should use: `fileIds: options.fileIds || []` (streaming does this ✅)
  
- ❌ **FileIds might be in wrong format** (not string array)
  - Check: `hooks/use-file-upload.ts` line 249-250
  - `getUploadedFileIds()` returns `uploadedFiles.map(f => f.id)`
  
- ❌ **JSON.stringify might fail if fileIds contains invalid data**
  - Check: Ensure all fileIds are strings

### 2. **Network Request Level**
- ❌ **Backend doesn't receive fileIds**
  - Check Network tab - is `fileIds` field present in request body?
  
- ❌ **Backend expects different field name**
  - Code uses `fileIds` but backend might expect `files` or `file_ids`
  - Check: `app/api/pelican_response/route.ts` line 139 uses `files: fileIds || []`
  - **INCONSISTENCY:** Streaming uses `fileIds`, non-streaming might use `files`?

### 3. **Backend Response Handling**
- ❌ **Backend crashes when processing files**
  - Check backend logs
  - Backend should fetch files by ID from `files` table
  - Backend should have signed URLs to access Supabase Storage files

---

## 🔧 Quick Answers to Your Questions

### Q: How are you sending the file?
**A:** Only **fileIds (string array)** in JSON body. Files are uploaded separately to Supabase Storage first.

### Q: Does crash happen client-side or after backend responds?
**A:** Need to check:
- **Console error?** → Client-side or network error
- **Network tab shows failed request?** → Backend error
- **Network tab shows success but UI crashes?** → Response parsing error

### Q: File size limit?
**A:** **15MB** (see `app/api/upload/route.ts` line 8)

---

## 🚨 Critical Issues to Check

### Issue 1: Inconsistent Field Names
- `hooks/use-chat.ts` (non-streaming) sends: `fileIds`
- `app/api/pelican_response/route.ts` sends: `files: fileIds || []`
- `hooks/use-streaming-chat.ts` sends: `fileIds`

**Check:** Does your backend expect `fileIds` or `files`?

### Issue 2: fileIds Might Be Undefined
```typescript
// hooks/use-chat.ts line 259
fileIds: options.fileIds,  // ❌ Could be undefined

// Should be:
fileIds: options.fileIds || [],  // ✅ Empty array if undefined
```

### Issue 3: Backend File Access
Backend receives fileIds, but needs to:
1. Query `files` table by ID
2. Get `storage_path` from database
3. Generate signed URL or use service role to access Supabase Storage
4. Download file content for processing

**Check:** Does your backend have code to fetch files by ID?

---

## 📝 Debug Checklist

1. **✅ Upload works?** 
   - Check Network tab for `/api/upload` - should return `{ id, url, ... }`
   - Check console for `[upload] ok` log

2. **✅ FileIds stored?**
   - Check `fileUpload.getUploadedFileIds()` returns array of strings
   - Add console.log before sending message

3. **✅ Request includes fileIds?**
   - Check Network tab for `/api/pelican_response` request
   - Inspect request body - should have `fileIds: [...]`

4. **✅ Backend receives fileIds?**
   - Check backend logs
   - Verify backend endpoint expects `fileIds` or `files` field

5. **✅ Backend can fetch files?**
   - Backend needs to query Supabase `files` table
   - Backend needs access to Supabase Storage

---

## 🔍 Where to Add Debug Logs

### 1. Before sending message (chat page):
```typescript
// app/chat/page.tsx - handleSendMessageWithFiles
console.log('[DEBUG] Sending with files:', {
  message,
  fileIds: fileUpload.getUploadedFileIds(),
  attachments: fileUpload.getUploadedAttachments()
})
```

### 2. In chat hook (before request):
```typescript
// hooks/use-chat.ts - sendMessage function
console.log('[DEBUG] Request payload:', {
  message: userMessage.content,
  fileIds: options.fileIds,
  conversationId: currentConversationId
})
```

### 3. Check Network tab:
- Open DevTools → Network
- Filter by `/api/pelican_response` or backend URL
- Inspect request payload
- Check response status/error

---

## 📋 Expected Behavior

1. ✅ User selects file → File uploads → Returns `fileId`
2. ✅ FileId stored in `uploadedFiles` state
3. ✅ User types message and clicks send
4. ✅ `handleSendMessageWithFiles` gets fileIds array
5. ✅ Request sent with `fileIds: ["uuid-1", ...]` in body
6. ✅ Backend receives request, fetches files by ID, processes
7. ✅ Backend returns response

**Crash likely at step 5-6**: Either request format wrong, or backend can't handle fileIds.

