-- =====================================================
-- Verification Queries for Frontend Refactor
-- =====================================================
-- Run these in Supabase SQL Editor after testing

-- 1. Check recent messages are saving with empty metadata
-- Replace 'your-conversation-id' with a test conversation ID
SELECT 
  id,
  role, 
  LEFT(content, 50) as content_preview,
  metadata,
  created_at 
FROM messages 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at DESC 
LIMIT 10;

-- Expected: metadata should be {} for new messages


-- 2. Check all recent messages across conversations
SELECT 
  conversation_id,
  role,
  metadata,
  created_at
FROM messages 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;


-- 3. Verify conversations are still updating correctly
SELECT 
  id,
  title,
  message_count,
  LEFT(last_message_preview, 50) as preview,
  updated_at
FROM conversations
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 10;


-- 4. Check for any NULL user_ids (shouldn't happen)
SELECT COUNT(*) as null_user_id_count
FROM messages
WHERE user_id IS NULL
AND created_at > NOW() - INTERVAL '1 hour';
-- Expected: 0

