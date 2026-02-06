# Conversation Storage Diagnostic Guide

## Problem
Conversations are not being stored when users create new chats. The conversation is created in the UI but doesn't persist to the database.

## Root Causes (Likely Culprits)

### 1. **Supabase RLS (Row Level Security) - MOST LIKELY**
The conversations table likely has RLS policies that are blocking inserts.

**Check Supabase Dashboard:**
1. Go to Authentication → Policies
2. Look for the `conversations` table
3. Check if there's a policy allowing INSERT for authenticated users
4. If not, add this policy:

```sql
CREATE POLICY "Users can create their own conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 2. **Authentication Not Passed Correctly**
The user_id might not be set correctly when inserting.

**Check These:**
- Is `user?.id` available when `createConversation()` is called?
- Is the user actually authenticated?
- Are you using `user_id` or `user.id` inconsistently?

### 3. **Supabase Client Configuration**
The frontend Supabase client might not have the right permissions.

**Check:**
- Is the Supabase URL correct?
- Is the anon key correct?
- Are credentials environment variables set?

### 4. **Database Constraint Violation**
Could be a foreign key or unique constraint issue.

**Check Supabase:**
- Does the `conversations` table have correct column types?
- Is `user_id` a foreign key to `auth.users`?
- Are there any unique constraints?

## How to Diagnose

### Step 1: Check Browser Console
When creating a new chat, look for these logs:

**If you see:**
```
🔷 [Create Conversation] Attempting to create conversation
```
Then the creation started.

**If you see:**
```
✅ [Create Conversation] Successfully created
```
Then the frontend successfully created it.

**If you see:**
```
❌ [Create Conversation] Database error
❌ [Create Conversation] Failed
```
Then you have a database error. The error details will show what's wrong.

### Step 2: Check Server Logs
If conversations ARE being created by the API endpoints:

```
✅ [PELICAN_RESPONSE] Created conversation in DB
✅ [CHAT_RESPONSE] Created conversation in DB
```

If you see these logs, the conversation is being created on message send.

### Step 3: Check Supabase Directly
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run:
```sql
SELECT id, title, user_id, created_at FROM conversations ORDER BY created_at DESC LIMIT 10;
```

If the query returns rows, the data IS being saved. Check if the user_id matches the logged-in user.

### Step 4: Check Browser DevTools Network Tab
When creating a conversation:
1. Open DevTools → Network tab
2. Filter for "conversations"
3. Look for the POST request to `/api/conversations` or database insert
4. Check the response status:
   - 201/200 = Success
   - 400 = Bad request
   - 401 = Unauthorized
   - 403 = Forbidden (RLS policy issue)
   - 500 = Server error

## Most Likely Fix: Enable RLS Policy

**This is probably the issue.** Follow these steps:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Authentication → Policies**
4. Click on the **conversations** table
5. Click **New Policy**
6. Choose **Insert** 
7. Name it: `Users can create their own conversations`
8. Set the expression to:
   ```sql
   auth.uid() = user_id
   ```
9. Click **Save**

10. Click **New Policy** again
11. Choose **Select**
12. Name it: `Users can read their own conversations`
13. Set the expression to:
    ```sql
    auth.uid() = user_id
    ```
14. Click **Save**

15. Click **New Policy** again
16. Choose **Update**
17. Name it: `Users can update their own conversations`
18. Set the expression to:
    ```sql
    auth.uid() = user_id
    ```
19. Click **Save**

Then test creating a new chat.

## Error Messages and Solutions

### "PGRST106: User cannot access this table"
**Cause:** RLS policy missing or denying access
**Fix:** Add RLS policies as shown above

### "user_id does not match auth.uid()"
**Cause:** Wrong user_id being passed
**Fix:** Ensure `user?.id` is the correct value

### "violates foreign key constraint"
**Cause:** user_id doesn't exist in auth.users
**Fix:** Check the user is actually authenticated

### "duplicate key value violates unique constraint"
**Cause:** Conversation already exists with same ID
**Fix:** Delete and retry, or check for duplicate IDs

## Quick Test

Open browser console and run:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user:', user?.id);

// Try creating a conversation directly
const { data, error } = await supabase
  .from('conversations')
  .insert({ user_id: user.id, title: 'Test' })
  .select();

console.log('Insert result:', { data, error });
```

If this fails, it's definitely a database/RLS issue.

## After Fixing

1. Reload the page
2. Click "New Chat"
3. Look for the success logs:
   - Frontend: `✅ [Create Conversation] Successfully created`
   - API: `✅ [PELICAN_RESPONSE] Created conversation in DB`
4. Check Supabase - conversation should appear in the table

## Still Not Working?

1. Check Sentry dashboard for errors
2. Check Supabase audit logs for what requests were rejected
3. Verify auth credentials in environment variables
4. Try creating conversation via Supabase Studio UI directly to test database

## Files Modified with Logging

- `hooks/use-conversations.ts` - Added detailed creation logging
- `app/api/pelican_response/route.ts` - Added confirmation logs
- `app/api/chat/route.ts` - Added confirmation logs

Look for the following tags in console:
- `🔷` - Attempting creation
- `✅` - Success
- `❌` - Error

