-- =====================================================
-- Quick Fix for Existing Database
-- =====================================================
-- Run this if you already have conversations/messages tables
-- but they're missing required columns
-- =====================================================

-- Add missing columns to conversations table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='conversations' AND column_name='last_message_preview') THEN
        ALTER TABLE conversations ADD COLUMN last_message_preview TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='conversations' AND column_name='message_count') THEN
        ALTER TABLE conversations ADD COLUMN message_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='conversations' AND column_name='archived') THEN
        ALTER TABLE conversations ADD COLUMN archived BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='conversations' AND column_name='archived_at') THEN
        ALTER TABLE conversations ADD COLUMN archived_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='conversations' AND column_name='metadata') THEN
        ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add missing columns to messages table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='messages' AND column_name='metadata') THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='messages' AND column_name='user_id') THEN
        ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create GIN index on messages.metadata for fast ticker searches
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN(metadata);

-- Create other helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

RAISE NOTICE 'Database schema updated successfully!';
