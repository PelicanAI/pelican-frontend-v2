# Frontend Compatibility Audit — Database Migration (RLS)

**Date:** 2025-01-22  
**Scope:** All Supabase UPDATE, DELETE, UPSERT, and INSERT operations  
**Critical Issue:** Supabase UPDATE/DELETE operations without `.select()` return empty data on success OR on RLS rejection. We can't tell the difference. Adding `.select()` makes RLS rejections return errors.

---

## Question 1: Find ALL Supabase UPDATE operations

### File: `hooks/use-conversations.ts`
**Line 330:** `updateConversation` function
```typescript
const { error } = await supabase
  .from("conversations")
  .update(updates)
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections.  
**Suggested Fix:**
```typescript
const { data, error } = await supabase
  .from("conversations")
  .update(updates)
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
  .select()
  .single()

if (error || !data) {
  console.error('Update failed:', error?.message || 'No data returned (possible RLS rejection)')
  return false
}
return true
```

**Line 513:** `archive` function
```typescript
const { error } = await supabase
  .from("conversations")
  .update({ archived })
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections.  
**Suggested Fix:** Same pattern as above - add `.select().single()` and check `!data`.

---

### File: `app/api/conversations/[id]/route.ts`
**Line 99:** PATCH handler
```typescript
const { error } = await supabase
  .from("conversations")
  .update(updateData)
  .eq("id", id)
  .eq("user_id", user.id)
  .is("deleted_at", null)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections.  
**Suggested Fix:**
```typescript
const { data, error } = await supabase
  .from("conversations")
  .update(updateData)
  .eq("id", id)
  .eq("user_id", user.id)
  .is("deleted_at", null)
  .select()
  .single()

if (error || !data) {
  Sentry.captureException(error || new Error('RLS rejection: no data returned'), {
    tags: { action: 'conversation_update', conversation_id: id },
    extra: { updateData, userId: user.id }
  })
  return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
}
```

**Line 153:** DELETE handler (soft delete via UPDATE)
```typescript
const { error } = await supabase
  .from("conversations")
  .update({
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq("id", id)
  .eq("user_id", user.id)
  .is("deleted_at", null)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections.  
**Suggested Fix:** Same pattern - add `.select().single()` and check `!data`.

---

### File: `app/api/messages/[id]/regenerate/route.ts`
**Line 89:** Message content update
```typescript
const { error: updateError } = await supabase.from("messages").update({ content: newContent }).eq("id", id)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections. Also missing user_id filter for RLS.  
**Suggested Fix:**
```typescript
const { data, error: updateError } = await supabase
  .from("messages")
  .update({ content: newContent })
  .eq("id", id)
  .select()
  .single()

if (updateError || !data) {
  console.error("[v0] Error updating message:", updateError || 'RLS rejection')
  return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
}
```

---

### File: `lib/files.ts`
**Line 65:** `markClaimed` function
```typescript
const { error } = await supabase.from("files").update({ conversation_id: conversationId }).eq("id", fileId)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.update()`. Cannot detect RLS rejections.  
**Suggested Fix:**
```typescript
const { data, error } = await supabase
  .from("files")
  .update({ conversation_id: conversationId })
  .eq("id", fileId)
  .select()
  .single()

if (error || !data) {
  console.error("[files] Error marking file as claimed:", error || 'RLS rejection')
  throw new Error("Failed to claim file")
}
```

---

## Question 2: Find ALL Supabase DELETE operations

### File: `hooks/use-conversations.ts`
**Line 297:** `deleteConversation` function
```typescript
const { error } = await supabase
  .from("conversations")
  .delete()
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.delete()`. Cannot detect RLS rejections.  
**Suggested Fix:**
```typescript
const { data, error } = await supabase
  .from("conversations")
  .delete()
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
  .select()

if (error || !data || data.length === 0) {
  console.error("Failed to delete conversation:", error || 'RLS rejection')
  return false
}
return true
```

**Line 549:** `remove` function
```typescript
const { error } = await supabase
  .from("conversations")
  .delete()
  .eq("id", conversationId)
  .eq("user_id", effectiveUserId)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.delete()`. Cannot detect RLS rejections.  
**Suggested Fix:** Same pattern as above - add `.select()` and check `!data || data.length === 0`.

---

### File: `app/settings/page.tsx`
**Line 237-239:** `handleDeleteAccount` function
```typescript
await supabase.from("conversations").delete().eq("user_id", user.id)
await supabase.from("messages").delete().eq("user_id", user.id)
await supabase.from("user_settings").delete().eq("user_id", user.id)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No error checking, no `.select()`. Cannot detect RLS rejections or failures.  
**Suggested Fix:**
```typescript
const { data: convData, error: convError } = await supabase
  .from("conversations")
  .delete()
  .eq("user_id", user.id)
  .select()

if (convError) {
  logger.error("Failed to delete conversations", convError)
  throw convError
}

const { data: msgData, error: msgError } = await supabase
  .from("messages")
  .delete()
  .eq("user_id", user.id)
  .select()

if (msgError) {
  logger.error("Failed to delete messages", msgError)
  throw msgError
}

const { data: settingsData, error: settingsError } = await supabase
  .from("user_settings")
  .delete()
  .eq("user_id", user.id)
  .select()

if (settingsError) {
  logger.error("Failed to delete settings", settingsError)
  throw settingsError
}
```

**Line 258-259:** `handleClearHistory` function
```typescript
await supabase.from("conversations").delete().eq("user_id", user.id)
await supabase.from("messages").delete().eq("user_id", user.id)
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No error checking, no `.select()`. Cannot detect RLS rejections or failures.  
**Suggested Fix:** Same pattern as above - add error checking and `.select()`.

---

## Question 3: Find ALL Supabase UPSERT operations

### File: `app/settings/page.tsx`
**Line 181:** `handleSave` function
```typescript
const { error } = await supabase.from("user_settings").upsert({
  user_id: user.id,
  ...settings,
  updated_at: new Date().toISOString(),
})
```
**Status:** ❌ **NEEDS UPDATE**  
**Reason:** No `.select()` chained after `.upsert()`. Cannot detect RLS rejections.  
**Suggested Fix:**
```typescript
const { data, error } = await supabase
  .from("user_settings")
  .upsert({
    user_id: user.id,
    ...settings,
    updated_at: new Date().toISOString(),
  })
  .select()
  .single()

if (error || !data) {
  logger.error("Failed to save settings", error || new Error('RLS rejection'))
  toast.error("Failed to save settings. Please try again.")
  return
}
```

---

## Question 4: Find ALL Supabase INSERT operations

### File: `hooks/use-conversations.ts`
**Line 225:** `createConversation` function
```typescript
const { data, error } = await supabase
  .from("conversations")
  .insert({
    user_id: effectiveUserId,
    title,
  })
  .select()
  .single();
```
**Status:** ✅ **OK**  
**Reason:** Already uses `.select().single()` and checks both `error` and `data`. Properly handles failures.

---

### File: `app/api/conversations/route.ts`
**Line 114:** POST handler
```typescript
const { data: conversation, error } = await supabase
  .from("conversations")
  .insert({
    user_id: user.id,
    title,
  })
  .select()
  .single()
```
**Status:** ✅ **OK**  
**Reason:** Already uses `.select().single()` and checks `error`. Could also check `!conversation` for RLS rejections.

**Suggested Enhancement:**
```typescript
if (error || !conversation) {
  Sentry.captureException(error || new Error('RLS rejection: no data returned'), {
    tags: { action: 'conversation_create' },
    extra: { userId: user.id, title }
  })
  return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
}
```

---

### File: `app/api/upload/route.ts`
**Line 168:** File record insertion
```typescript
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
```
**Status:** ✅ **OK**  
**Reason:** Already uses `.select().single()` and checks both `error` and `!fileRecord`. Properly handles failures.

---

### File: `lib/files.ts`
**Line 51:** `insertFile` function
```typescript
const { data: file, error } = await supabase.from("files").insert(data).select().single()
```
**Status:** ✅ **OK**  
**Reason:** Already uses `.select().single()` and checks `error`. Properly handles failures.

---

### File: `lib/providers/auth-provider.tsx`
**Line 37:** Guest conversation migration
```typescript
const { data: newConv, error: convError } = await supabase
  .from('conversations')
  .insert({
    user_id: userId,
    title: guestConv.title || `Migrated conversation from ${new Date(guestConv.created_at).toLocaleDateString()}`,
    created_at: guestConv.created_at,
    metadata: {
      migrated_from_guest: true,
      original_guest_id: guestConv.id
    }
  })
  .select()
  .single()
```
**Status:** ✅ **OK**  
**Reason:** Already uses `.select().single()` and checks `error`. Properly handles failures.

**Line 73:** Message insertion (bulk)
```typescript
const { error: msgError } = await supabase
  .from('messages')
  .insert(messagesToInsert)
```
**Status:** ⚠️ **NEEDS ENHANCEMENT**  
**Reason:** No `.select()` and no data check. For bulk inserts, should check if any rows were inserted.  
**Suggested Fix:**
```typescript
const { data: insertedMessages, error: msgError } = await supabase
  .from('messages')
  .insert(messagesToInsert)
  .select()

if (msgError || !insertedMessages || insertedMessages.length === 0) {
  console.error('Failed to migrate messages:', msgError || 'RLS rejection')
} else {
  console.log(`Migrated ${insertedMessages.length} messages for conversation ${newConv.id}`)
}
```

---

### File: `components/test/conversation-memory-test.tsx`
**Line 68:** Test message insertion
```typescript
const { error: messageError } = await supabase.from("messages").insert([
  {
    conversation_id: testConversation.id,
    role: "user",
    content: "Test message 1: What is NVDA?",
  },
  // ... more messages
])
```
**Status:** ⚠️ **NEEDS ENHANCEMENT**  
**Reason:** No `.select()` and no data check. Should verify messages were actually inserted.  
**Suggested Fix:**
```typescript
const { data: insertedMessages, error: messageError } = await supabase
  .from("messages")
  .insert([...])
  .select()

if (messageError || !insertedMessages || insertedMessages.length === 0) {
  updateTestResult("Message Storage", "error", `Failed to save messages: ${messageError?.message || 'RLS rejection'}`)
} else {
  updateTestResult("Message Storage", "success", `Saved ${insertedMessages.length} messages successfully`)
}
```

---

## Question 5: Check user_id usage

### Pattern Analysis

**Direct Usage (✅ Good):**
- `user.id` is used directly from `supabase.auth.getUser()` in API routes
- `effectiveUserId = user?.id || guestUserId` pattern in hooks
- UUID validation exists for guest users in `use-conversations.ts` (lines 81-89)

**Issues Found:**

1. **File: `hooks/use-conversations.ts`**
   - Line 226, 276, 299, 332, 433, 515, 551: Uses `effectiveUserId` which could be guest UUID or real user ID
   - ✅ **OK:** Guest UUIDs are validated as proper UUIDs (lines 81-89)

2. **File: `lib/providers/auth-provider.tsx`**
   - Line 38, 63: Uses `userId` directly from session
   - ✅ **OK:** Comes from authenticated session

3. **File: `app/api/upload/route.ts`**
   - Line 169: Uses `userId || null` - could be undefined
   - ⚠️ **NEEDS VALIDATION:** Should validate UUID format if present

4. **File: `app/settings/page.tsx`**
   - Line 182, 237, 238, 239, 258, 259: Uses `user.id` directly
   - ✅ **OK:** Comes from authenticated session

**UUID Validation Recommendations:**
- Add UUID validation helper function
- Validate `user.id` before using in queries (though Supabase should provide valid UUIDs)
- Ensure guest IDs are always valid UUIDs (already done in `use-conversations.ts`)

---

## Question 6: Find conversation-related operations

### Conversations Table Operations

**File: `hooks/use-conversations.ts`**
- ✅ `loadConversations` (line 176): SELECT with proper error handling
- ❌ `updateConversation` (line 330): UPDATE without `.select()` - **NEEDS FIX**
- ❌ `deleteConversation` (line 297): DELETE without `.select()` - **NEEDS FIX**
- ✅ `createConversation` (line 225): INSERT with `.select().single()` - **OK**
- ❌ `archive` (line 513): UPDATE without `.select()` - **NEEDS FIX**
- ❌ `remove` (line 549): DELETE without `.select()` - **NEEDS FIX**

**File: `app/api/conversations/route.ts`**
- ✅ GET handler (line 24): SELECT with proper error handling
- ✅ POST handler (line 114): INSERT with `.select().single()` - **OK**

**File: `app/api/conversations/[id]/route.ts`**
- ✅ GET handler (line 20): SELECT with proper error handling
- ❌ PATCH handler (line 99): UPDATE without `.select()` - **NEEDS FIX**
- ❌ DELETE handler (line 153): UPDATE (soft delete) without `.select()` - **NEEDS FIX**

**File: `app/settings/page.tsx`**
- ❌ `handleDeleteAccount` (line 237): DELETE without error checking - **NEEDS FIX**
- ❌ `handleClearHistory` (line 258): DELETE without error checking - **NEEDS FIX**

### Messages Table Operations

**File: `app/api/messages/[id]/regenerate/route.ts`**
- ✅ GET message (line 19): SELECT with proper error handling
- ❌ UPDATE message (line 89): UPDATE without `.select()` - **NEEDS FIX**

**File: `lib/providers/auth-provider.tsx`**
- ⚠️ INSERT messages (line 73): INSERT without `.select()` - **NEEDS ENHANCEMENT**

**File: `components/test/conversation-memory-test.tsx`**
- ⚠️ INSERT messages (line 68): INSERT without `.select()` - **NEEDS ENHANCEMENT**

### Files Table Operations

**File: `lib/files.ts`**
- ✅ `getByChecksum` (line 31): SELECT with proper error handling
- ✅ `insertFile` (line 51): INSERT with `.select().single()` - **OK**
- ❌ `markClaimed` (line 65): UPDATE without `.select()` - **NEEDS FIX**
- ✅ `getByConversation` (line 77): SELECT with proper error handling

**File: `app/api/upload/route.ts`**
- ✅ INSERT file (line 168): INSERT with `.select().single()` - **OK**

---

## Question 7: Check error handling patterns

### Current Error Handling Analysis

**✅ Good Patterns Found:**
1. Most INSERT operations use `.select().single()` and check both `error` and `data`
2. API routes use Sentry for error tracking
3. Client-side hooks log errors to console

**❌ Missing Patterns:**

1. **RLS Rejection Detection:**
   - Most UPDATE/DELETE operations don't check for `!data` after `.select()`
   - Cannot distinguish between success and RLS rejection

2. **User-Facing Error Messages:**
   - `hooks/use-conversations.ts`: Returns `false` on error but doesn't show user message
   - `app/settings/page.tsx`: Uses toast notifications ✅
   - API routes return JSON errors ✅

3. **Error Logging:**
   - Client-side: Uses `console.error` ✅
   - Server-side: Uses Sentry ✅
   - Missing: Structured error logging for RLS rejections

**Recommended Error Handling Pattern:**
```typescript
const { data, error } = await supabase
  .from("table")
  .update({ ... })
  .eq("id", id)
  .eq("user_id", user.id)
  .select()
  .single()

if (error) {
  // Supabase error (network, constraint violation, etc.)
  console.error('Operation failed:', error)
  Sentry.captureException(error, { tags: { operation: 'update' } })
  return { success: false, error: error.message }
}

if (!data) {
  // RLS rejection - no error but no data returned
  console.error('RLS rejection: Operation succeeded but no data returned')
  Sentry.captureException(new Error('RLS rejection'), { 
    tags: { operation: 'update', table: 'table', id } 
  })
  return { success: false, error: 'Permission denied' }
}

return { success: true, data }
```

---

## Question 8: List ALL files with Supabase operations

### Complete File List

**Core Application Files:**
1. ✅ `hooks/use-conversations.ts` - Multiple operations (UPDATE, DELETE, INSERT, SELECT)
2. ✅ `app/api/conversations/route.ts` - GET, POST (SELECT, INSERT)
3. ✅ `app/api/conversations/[id]/route.ts` - GET, PATCH, DELETE (SELECT, UPDATE)
4. ✅ `app/api/messages/[id]/regenerate/route.ts` - POST (SELECT, UPDATE)
5. ✅ `app/api/upload/route.ts` - POST (INSERT)
6. ✅ `app/settings/page.tsx` - Multiple operations (UPSERT, DELETE, SELECT)
7. ✅ `app/profile/page.tsx` - SELECT operations only
8. ✅ `lib/files.ts` - SELECT, INSERT, UPDATE
9. ✅ `lib/providers/auth-provider.tsx` - INSERT operations

**Test/Debug Files:**
10. ✅ `components/test/conversation-memory-test.tsx` - INSERT operations

**Configuration Files:**
11. ✅ `lib/supabase/client.ts` - Client creation
12. ✅ `lib/supabase/server.ts` - Server client creation
13. ✅ `lib/supabase/middleware.ts` - Middleware client

**Documentation Files (not code):**
- Multiple `.md` files contain example code but are not executed

---

## Summary of Issues

### Critical Issues (Must Fix):
1. **6 UPDATE operations** without `.select()` - Cannot detect RLS rejections
2. **5 DELETE operations** without `.select()` - Cannot detect RLS rejections  
3. **1 UPSERT operation** without `.select()` - Cannot detect RLS rejections

### Medium Priority:
1. **2 INSERT operations** (bulk) without `.select()` - Cannot verify insertion success
2. Missing `!data` checks even where `.select()` exists
3. Missing UUID validation in some places

### Low Priority:
1. Error messages could be more user-friendly
2. Could add structured error logging for RLS rejections

---

## Duplicate Code Patterns

### Pattern 1: UPDATE without .select()
Found in:
- `hooks/use-conversations.ts:330` (updateConversation)
- `hooks/use-conversations.ts:513` (archive)
- `app/api/conversations/[id]/route.ts:99` (PATCH)
- `app/api/conversations/[id]/route.ts:153` (DELETE soft delete)
- `app/api/messages/[id]/regenerate/route.ts:89` (message update)
- `lib/files.ts:65` (markClaimed)

**Suggested Shared Helper:**
```typescript
// lib/supabase/helpers.ts
export async function updateWithRLSCheck<T>(
  supabase: SupabaseClient,
  table: string,
  updates: Partial<T>,
  filters: { [key: string]: any }
): Promise<{ data: T | null; error: PostgrestError | null }> {
  let query = supabase.from(table).update(updates)
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query.select().single()
  
  if (error || !data) {
    return { 
      data: null, 
      error: error || new Error('RLS rejection: no data returned') 
    }
  }
  
  return { data, error: null }
}
```

### Pattern 2: DELETE without .select()
Found in:
- `hooks/use-conversations.ts:297` (deleteConversation)
- `hooks/use-conversations.ts:549` (remove)
- `app/settings/page.tsx:237-239` (handleDeleteAccount)
- `app/settings/page.tsx:258-259` (handleClearHistory)

**Suggested Shared Helper:**
```typescript
export async function deleteWithRLSCheck(
  supabase: SupabaseClient,
  table: string,
  filters: { [key: string]: any }
): Promise<{ deleted: boolean; error: PostgrestError | null }> {
  let query = supabase.from(table).delete()
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query.select()
  
  if (error || !data || data.length === 0) {
    return { 
      deleted: false, 
      error: error || new Error('RLS rejection: no data returned') 
    }
  }
  
  return { deleted: true, error: null }
}
```

---

## Recommended Fix Priority

### Priority 1 (Critical - Fix Immediately):
1. All UPDATE operations in conversation/message flows
2. All DELETE operations in conversation flows
3. UPSERT in settings page

### Priority 2 (High - Fix Soon):
1. Bulk INSERT operations
2. Add `!data` checks to existing `.select()` operations

### Priority 3 (Medium - Fix When Possible):
1. Create shared helper functions to reduce duplication
2. Add UUID validation utilities
3. Enhance error messages for users

---

**End of Audit Report**

