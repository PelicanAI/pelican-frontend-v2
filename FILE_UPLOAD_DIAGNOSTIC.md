# File Upload Flow Diagnostic Guide

## 1. File Upload Flow - Where does it fail?

### Flow Overview:
1. **User selects file** → `ChatInput` component → `onFileUpload` callback
2. **File validation** → `use-file-upload.ts` → checks type & size
3. **Upload to Supabase Storage** → `/api/upload` route → `pelican` bucket
4. **Save metadata to database** → `files` table insert
5. **Return file ID** → Frontend stores in `uploadedFiles` state
6. **User sends message** → `fileIds` included in message payload
7. **Backend receives** → `files: string[]` array in streaming payload

### Checkpoints:

#### ✅ Step 1: File Upload to Supabase Storage
**Location:** `app/api/upload/route.ts` lines 144-161

```144:161:Pelican-frontend/app/api/upload/route.ts
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pelican")
      .upload(storageKey, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error(`[${requestId}] Upload error:`, uploadError)
      captureException(new Error(`File upload failed: ${uploadError.message}`), {
        reqId: requestId,
        userId,
        guestId,
        fileMeta,
      })
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
```

**Check Network Tab:**
- Look for request to `/api/upload`
- Status should be `200 OK`
- Response should contain: `{ id, url, key, name, type, size }`
- If status is `500`, check console for `[requestId] Upload error:`

**Common Issues:**
- ❌ Bucket `pelican` doesn't exist → Check Supabase Storage
- ❌ RLS policies blocking upload → Check storage policies
- ❌ File size exceeds 15MB → Returns `413` status
- ❌ Invalid MIME type → Returns `400` with `unsupported_type`

#### ✅ Step 2: File Metadata Save to Database
**Location:** `app/api/upload/route.ts` lines 166-189

```166:189:Pelican-frontend/app/api/upload/route.ts
    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        user_id: userId || null,
        storage_path: storageKey,
        mime_type: file.type,
        name: sanitizedFilename,
        size: file.size,
      })
      .select()
      .single()

    if (dbError || !fileRecord) {
      console.error(`[${requestId}] Database insert error:`, dbError)
      // Clean up: delete the uploaded file from storage since DB insert failed
      await supabase.storage.from("pelican").remove([storageKey])
      captureException(new Error(`Failed to save file metadata: ${dbError?.message}`), {
        reqId: requestId,
        userId,
        guestId,
        fileMeta,
      })
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 })
    }
```

**Check:**
- If upload succeeds but response is `500` with "Failed to save file metadata"
- Check console for `[requestId] Database insert error:`
- Verify `files` table exists and has correct schema
- Check RLS policies on `files` table

#### ✅ Step 3: File ID Included in Message Payload
**Location:** `app/chat/page.tsx` lines 186-199

```186:199:Pelican-frontend/app/chat/page.tsx
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

**Location:** `hooks/use-streaming-chat.ts` lines 107-132

```107:132:Pelican-frontend/hooks/use-streaming-chat.ts
function buildStreamingPayload(
  message: string,
  history: ConversationMessage[],
  conversationId: string | null,
  fileIds: string[]
): StreamingPayload {
  // Filter out system messages and map to clean format
  const cleanHistory = history
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  const payload: StreamingPayload = {
    message,
    conversationHistory: cleanHistory, // camelCase for frontend compatibility
    conversation_history: cleanHistory, // snake_case for backend compatibility
    conversationId: conversationId,
    files: fileIds,
    timestamp: new Date().toISOString(),
    stream: true,
  };

  return payload;
}
```

**Check Network Tab:**
- Look for POST request to `/api/pelican_stream` (or backend URL)
- Inspect request payload - should have `files: ["uuid-1", "uuid-2", ...]`
- If `files` is `[]` or missing, fileIds weren't passed correctly

**Debug Console:**
- Check for `[STREAM-DEBUG] Full payload:` log
- Verify `files: fileIds.length` shows correct count

---

## 2. Files for Review

### Core Upload Component
**File:** `components/chat/file-upload-zone.tsx`
- Dropzone UI component
- File validation (type, size)
- Multiple file selection

### Upload Hook
**File:** `hooks/use-file-upload.ts`
- Main upload logic
- Handles single & multiple files
- Manages `uploadedFiles` state
- Returns `getUploadedFileIds()` function

### Upload API Route
**File:** `app/api/upload/route.ts`
- Supabase Storage upload
- Database insert
- File validation (MIME type, magic bytes)
- Returns file ID

### Chat Input Component
**File:** `components/chat/chat-input.tsx`
- File input handler
- Drag & drop support
- Attachment preview

### Message Handler
**File:** `hooks/use-message-handler.ts`
- Receives fileIds from chat page
- Passes to `sendMessage`

### Streaming Chat Hook
**File:** `hooks/use-streaming-chat.ts`
- Builds payload with `files: fileIds`
- Sends to backend

---

## 3. Console/Network Diagnostics

### Console Errors to Check:

1. **Upload Error:**
   ```
   [v0] File upload error: [Error message]
   ```
   - Check Network tab → `/api/upload` request
   - Status code and response body

2. **Database Error:**
   ```
   [requestId] Database insert error: [error details]
   ```
   - Check Supabase logs
   - Verify `files` table RLS policies

3. **Streaming Error:**
   ```
   [STREAM-ERROR] Streaming failed: [error message]
   ```
   - Check if `files` array is in payload
   - Verify backend receives fileIds

### Network Tab Checks:

#### Upload Request (`/api/upload`):
- **Method:** POST
- **Status:** Should be `200 OK`
- **Response Body:**
  ```json
  {
    "id": "uuid-here",
    "url": "signed-url",
    "key": "2024/01/uuid.ext",
    "name": "filename.ext",
    "type": "image/png",
    "size": 12345,
    "checksum": "sha256-hash",
    "public": false
  }
  ```

#### Message Request (`/api/pelican_stream` or backend URL):
- **Method:** POST
- **Request Body Should Include:**
  ```json
  {
    "message": "user message",
    "conversationHistory": [...],
    "conversation_history": [...],
    "conversationId": "uuid-or-null",
    "files": ["file-uuid-1", "file-uuid-2"],  // ← CHECK THIS
    "timestamp": "2024-01-01T00:00:00.000Z",
    "stream": true
  }
  ```

**Critical Check:**
- ✅ `files` array exists
- ✅ `files` contains string UUIDs (not objects)
- ✅ `files.length > 0` when files are attached
- ❌ If `files: []` or missing → fileIds not being passed

---

## 4. Supabase Checks

### Check Files Table Entries

```sql
-- Check if files table has any entries
SELECT * FROM files 
WHERE user_id = '6f182e43-0a80-4636-b147-90e2ff81e4a6'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- Should show file records with:
  - `id` (UUID)
  - `user_id` (UUID or null)
  - `storage_path` (e.g., "2024/01/uuid.ext")
  - `mime_type` (e.g., "image/png")
  - `name` (sanitized filename)
  - `size` (bytes)
  - `created_at` (timestamp)

**If Empty:**
- Database insert is failing
- Check RLS policies on `files` table
- Check console for database errors

### Check Storage Bucket

```sql
-- Check storage bucket exists and policies
SELECT * FROM storage.buckets WHERE name = 'pelican';
```

**Expected Result:**
- Should return bucket named `pelican`
- Check `public` field (should be `false` for private bucket)

### Check Storage Policies

```sql
-- Check storage policies for pelican bucket
SELECT * FROM storage.policies 
WHERE bucket_id = 'pelican';
```

**Required Policies:**
1. **INSERT Policy:** Allow authenticated users to upload
2. **SELECT Policy:** Allow users to read their own files
3. **DELETE Policy:** Allow users to delete their own files (optional)

### Check Files Table RLS Policies

```sql
-- Check RLS policies on files table
SELECT * FROM pg_policies 
WHERE tablename = 'files';
```

**Required Policies:**
1. **INSERT:** Allow authenticated users to insert
2. **SELECT:** Allow users to read their own files
3. **UPDATE:** Allow users to update their own files (optional)
4. **DELETE:** Allow users to delete their own files (optional)

---

## Common Issues & Solutions

### Issue 1: Upload Succeeds but File ID Not in Message
**Symptoms:**
- Upload returns `200 OK` with file ID
- Message sent but `files: []` in payload

**Check:**
1. `fileUpload.getUploadedFileIds()` returns array
2. `handleSendMessageWithFiles` receives fileIds
3. `messageHandler.handleSendMessage` passes fileIds
4. `use-chat.ts` includes fileIds in sendOptions
5. `use-streaming-chat.ts` includes in payload

**Fix:**
- Add console.log at each step to trace fileIds
- Verify `uploadedFiles` state is not cleared before send

### Issue 2: Database Insert Fails
**Symptoms:**
- Storage upload succeeds
- Response is `500` with "Failed to save file metadata"

**Fix:**
- Check `files` table schema matches insert fields
- Verify RLS policies allow INSERT
- Check for NOT NULL constraints on required fields

### Issue 3: Backend Doesn't Receive Files
**Symptoms:**
- Frontend sends `files: ["uuid"]` in payload
- Backend doesn't process files

**Fix:**
- Verify backend expects `files` field (not `fileIds` or `file_ids`)
- Check backend logs for received payload
- Ensure backend can query `files` table by ID

---

## Debug Checklist

- [ ] Upload request succeeds (Network tab → `/api/upload` → `200 OK`)
- [ ] Response contains `id` field (file UUID)
- [ ] File record exists in `files` table (SQL query)
- [ ] `uploadedFiles` state contains file (console.log)
- [ ] `getUploadedFileIds()` returns array (console.log)
- [ ] Message payload includes `files: ["uuid"]` (Network tab)
- [ ] Backend receives `files` array (backend logs)
- [ ] Storage bucket `pelican` exists
- [ ] Storage policies allow upload
- [ ] Files table RLS policies allow insert/select

