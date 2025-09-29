-- Enhanced files table for de-duplication and conversation tracking
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id TEXT NULL,
  conversation_id UUID NULL,
  storage_key TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_user_created ON files(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_files_conversation_created ON files(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON files(checksum);

-- RLS policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can see their own files
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

-- Users can insert their own files
CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

-- Users can update their own files
CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );
