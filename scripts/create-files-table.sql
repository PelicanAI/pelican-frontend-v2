-- Create files table for de-duplication and tracking
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checksum VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  storage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast checksum lookups
CREATE INDEX IF NOT EXISTS idx_files_checksum ON files(checksum);

-- Index for storage key lookups
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON files(storage_key);
