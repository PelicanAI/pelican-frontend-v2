-- ============================================================================
-- Migration: Fix Escaped HTML Entities in Messages
-- Date: 2025-11-07
-- Purpose: Decode HTML entities that were incorrectly stored in message content
-- 
-- IMPORTANT: Create a backup before running this migration!
-- Run: CREATE TABLE messages_backup_20251107 AS SELECT * FROM messages;
-- ============================================================================

-- Step 1: Create backup table (REQUIRED - run this first!)
CREATE TABLE IF NOT EXISTS messages_backup_20251107 AS 
SELECT * FROM messages;

-- Verify backup was created
SELECT COUNT(*) as backup_count FROM messages_backup_20251107;

-- Step 2: Show preview of what will be changed
SELECT 
  id,
  role,
  LEFT(content, 100) as current_content,
  LEFT(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(content, '&#x27;', ''''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&lt;', '<'),
        '&gt;', '>'),
      '&#x2F;', '/'
    ), 100
  ) as new_content,
  created_at
FROM messages 
WHERE content LIKE '%&#x27;%' 
   OR content LIKE '%&quot;%'
   OR content LIKE '%&amp;%'
   OR content LIKE '%&lt;%'
   OR content LIKE '%&gt;%'
   OR content LIKE '%&#x2F;%'
ORDER BY created_at DESC
LIMIT 20;

-- Step 3: Update messages to decode HTML entities
-- This will fix apostrophes, quotes, ampersands, and angle brackets
UPDATE messages 
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content, '&#x27;', ''''),
          '&quot;', '"'),
        '&amp;', '&'),
      '&lt;', '<'),
    '&gt;', '>'),
  '&#x2F;', '/')
WHERE content LIKE '%&#x27;%' 
   OR content LIKE '%&quot;%'
   OR content LIKE '%&amp;%'
   OR content LIKE '%&lt;%'
   OR content LIKE '%&gt;%'
   OR content LIKE '%&#x2F;%';

-- Step 4: Verify the fix
-- Check if any HTML entities remain
SELECT 
  COUNT(*) as remaining_escaped_messages,
  COUNT(CASE WHEN content LIKE '%&#x27;%' THEN 1 END) as apostrophes,
  COUNT(CASE WHEN content LIKE '%&quot;%' THEN 1 END) as quotes,
  COUNT(CASE WHEN content LIKE '%&amp;%' THEN 1 END) as ampersands,
  COUNT(CASE WHEN content LIKE '%&lt;%' THEN 1 END) as less_than,
  COUNT(CASE WHEN content LIKE '%&gt;%' THEN 1 END) as greater_than
FROM messages;

-- Step 5: Show sample of fixed messages
SELECT 
  id,
  role,
  LEFT(content, 150) as fixed_content,
  created_at
FROM messages 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- ============================================================================
-- To restore from backup:
-- 
-- DELETE FROM messages;
-- INSERT INTO messages SELECT * FROM messages_backup_20251107;
-- 
-- After verifying everything works, you can drop the backup:
-- DROP TABLE messages_backup_20251107;
-- ============================================================================

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration:
-- 1. Creates a backup of all messages
-- 2. Shows a preview of what will change
-- 3. Decodes common HTML entities:
--    - &#x27; → ' (apostrophe)
--    - &quot; → " (quote)
--    - &amp;  → & (ampersand)
--    - &lt;   → < (less than)
--    - &gt;   → > (greater than)
--    - &#x2F; → / (forward slash)
-- 4. Verifies the changes
-- 5. Shows sample results
--
-- Future messages will be stored as raw text (no pre-escaping) and
-- React/DOMPurify will handle escaping at render time.
-- ============================================================================

