-- =====================================================
-- Pelican Trading - Database Setup Script
-- =====================================================
-- This script creates the necessary tables, indexes, and RLS policies
-- for the Pelican Trading authentication and memory system.
--
-- Run this script in your Supabase SQL Editor.
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid()

-- =====================================================
-- TABLE: conversations
-- =====================================================
-- Stores conversation metadata for each user
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLE: messages
-- =====================================================
-- Stores individual messages with trading metadata
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- For tickers, prices, positions, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- GIN index for JSONB metadata queries (ticker search, etc.)
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN(metadata);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on both tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only delete their own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can only see their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only delete their own messages" ON messages;

-- Conversations policies
CREATE POLICY "Users can only see their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can only see their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get trading context for a user
-- Retrieves messages that mention specific tickers or all recent messages
CREATE OR REPLACE FUNCTION get_trading_context(
  p_user_id UUID,
  p_tickers TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If tickers are provided, search for messages containing those tickers
  IF p_tickers IS NOT NULL AND array_length(p_tickers, 1) > 0 THEN
    RETURN QUERY
    SELECT m.id, m.role, m.content, m.metadata, m.created_at
    FROM messages m
    WHERE m.user_id = p_user_id
      AND m.metadata->'tickers' ?| p_tickers -- Check if any ticker matches
    ORDER BY m.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Return recent messages if no tickers specified
    RETURN QUERY
    SELECT m.id, m.role, m.content, m.metadata, m.created_at
    FROM messages m
    WHERE m.user_id = p_user_id
    ORDER BY m.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Function to get all positions mentioned by a user
CREATE OR REPLACE FUNCTION get_user_positions(p_user_id UUID)
RETURNS TABLE (
  ticker TEXT,
  last_action TEXT,
  last_price NUMERIC,
  last_mentioned TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    jsonb_array_elements_text(m.metadata->'tickers') as ticker,
    (m.metadata->>'action')::TEXT as last_action,
    (m.metadata->'prices'->0)::NUMERIC as last_price,
    m.created_at as last_mentioned
  FROM messages m
  WHERE m.user_id = p_user_id
    AND m.metadata ? 'tickers'
    AND m.metadata->'tickers' != '[]'::jsonb
  ORDER BY ticker, last_mentioned DESC;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON conversations;
CREATE TRIGGER update_conversation_timestamp_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- =====================================================
-- GRANTS
-- =====================================================
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_trading_context TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_positions TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify the setup

-- Check if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
    RAISE NOTICE '✓ conversations table created';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
    RAISE NOTICE '✓ messages table created';
  END IF;
END $$;

-- Check if indexes exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_messages_metadata') THEN
    RAISE NOTICE '✓ GIN index on messages.metadata created';
  END IF;
END $$;

RAISE NOTICE '=====================================================';
RAISE NOTICE 'Database setup complete!';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Run setup-founder-accounts.sql to create test accounts';
RAISE NOTICE '2. Test authentication and message storage';
RAISE NOTICE '=====================================================';
