-- =====================================================
-- PRODUCTION-GRADE MEMORY FIX MIGRATION
-- =====================================================
-- This fixes the memory context issue by ensuring all messages
-- have proper user_id values and adds data integrity constraints
-- =====================================================

-- Step 1: Diagnose the current data issue
SELECT 
  'DIAGNOSTIC: Current message data integrity' as step,
  COUNT(*) as total_messages,
  COUNT(user_id) as messages_with_user_id,
  COUNT(*) - COUNT(user_id) as messages_missing_user_id
FROM messages;

-- Step 2: Show sample of problematic data
SELECT 
  'SAMPLE: Recent messages with missing user_id' as step,
  m.id,
  m.conversation_id,
  m.user_id as message_user_id,
  c.user_id as conversation_user_id,
  m.role,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.user_id IS NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- Step 3: Fix existing messages by setting user_id from conversation
UPDATE messages m
SET user_id = c.user_id
FROM conversations c
WHERE m.conversation_id = c.id
AND m.user_id IS NULL;

-- Step 4: Verify the fix
SELECT 
  'VERIFICATION: After fixing user_id values' as step,
  COUNT(*) as total_messages,
  COUNT(user_id) as messages_with_user_id,
  COUNT(*) - COUNT(user_id) as messages_missing_user_id
FROM messages;

-- Step 5: Add database constraints to prevent future issues
-- Add NOT NULL constraint to user_id in messages table
ALTER TABLE messages 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint if not exists
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey,
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create compound index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conv_user 
ON messages(conversation_id, user_id);

-- Create additional performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_created 
ON messages(user_id, created_at DESC);

-- Step 6: Final verification
SELECT 
  'FINAL CHECK: All constraints and indexes created' as step,
  'Migration completed successfully!' as status;

-- Show final data integrity check
SELECT 
  'FINAL DATA CHECK:' as step,
  COUNT(*) as total_messages,
  COUNT(user_id) as messages_with_user_id,
  ROUND((COUNT(user_id)::float / COUNT(*)) * 100, 2) as integrity_percentage
FROM messages;
