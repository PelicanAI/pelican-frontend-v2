-- ============================================================================
-- Migration: Fix Escaped HTML Entities in Messages and Conversation Titles
-- Date: 2025-11-07
-- Purpose: Decode HTML entities that were incorrectly stored in message content
--          and conversation titles
-- 
-- IMPORTANT: Create a backup before running this migration!
-- ============================================================================

-- Step 1: Create backup tables (REQUIRED - run this first!)
CREATE TABLE IF NOT EXISTS messages_backup_20251107 AS 
SELECT * FROM messages;

CREATE TABLE IF NOT EXISTS conversations_backup_20251107 AS 
SELECT * FROM conversations;

-- Verify backups were created
SELECT COUNT(*) as messages_backup_count FROM messages_backup_20251107;
SELECT COUNT(*) as conversations_backup_count FROM conversations_backup_20251107;

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
-- PART 2: Fix Conversation Titles
-- ============================================================================

-- Step 6: Show preview of conversation titles that will be changed
SELECT 
  id,
  title as current_title,
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(title, '&#x27;', ''''),
            '&quot;', '"'),
          '&amp;', '&'),
        '&lt;', '<'),
      '&gt;', '>'),
    '&#x2F;', '/'
  ) as new_title,
  created_at
FROM conversations 
WHERE title LIKE '%&#x27;%' 
   OR title LIKE '%&quot;%'
   OR title LIKE '%&amp;%'
   OR title LIKE '%&lt;%'
   OR title LIKE '%&gt;%'
   OR title LIKE '%&#x2F;%'
ORDER BY created_at DESC
LIMIT 20;

-- Step 7: Update conversation titles to decode HTML entities
UPDATE conversations 
SET title = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(title, '&#x27;', ''''),
          '&quot;', '"'),
        '&amp;', '&'),
      '&lt;', '<'),
    '&gt;', '>'),
  '&#x2F;', '/')
WHERE title LIKE '%&#x27;%' 
   OR title LIKE '%&quot;%'
   OR title LIKE '%&amp;%'
   OR title LIKE '%&lt;%'
   OR title LIKE '%&gt;%'
   OR title LIKE '%&#x2F;%';

-- Step 8: Verify conversation titles are fixed
SELECT 
  COUNT(*) as remaining_escaped_titles,
  COUNT(CASE WHEN title LIKE '%&#x27;%' THEN 1 END) as apostrophes,
  COUNT(CASE WHEN title LIKE '%&quot;%' THEN 1 END) as quotes,
  COUNT(CASE WHEN title LIKE '%&amp;%' THEN 1 END) as ampersands
FROM conversations;

-- Step 9: Show sample of fixed conversation titles
SELECT 
  id,
  title as fixed_title,
  created_at
FROM conversations 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- ============================================================================
-- To restore from backups:
-- 
-- DELETE FROM messages;
-- INSERT INTO messages SELECT * FROM messages_backup_20251107;
-- 
-- DELETE FROM conversations;
-- INSERT INTO conversations SELECT * FROM conversations_backup_20251107;
-- 
-- After verifying everything works, you can drop the backups:
-- DROP TABLE messages_backup_20251107;
-- DROP TABLE conversations_backup_20251107;
-- ============================================================================

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration:
-- 1. Creates backups of messages AND conversations tables
-- 2. Shows previews of what will change
-- 3. Decodes common HTML entities in both messages and conversation titles:
--    - &#x27; → ' (apostrophe)
--    - &quot; → " (quote)
--    - &amp;  → & (ampersand)
--    - &lt;   → < (less than)
--    - &gt;   → > (greater than)
--    - &#x2F; → / (forward slash)
-- 4. Verifies the changes
-- 5. Shows sample results
--
-- Future messages and titles will be stored as raw text (no pre-escaping) and
-- React/DOMPurify will handle escaping at render time.
-- 
-- This fixes both:
-- - Message content displaying &#x27; 
-- - Conversation titles in sidebar displaying &#x27;
-- ============================================================================

