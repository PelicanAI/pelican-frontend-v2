-- Add is_partial column to messages table
-- This allows tracking of incomplete/partial messages that were stopped by the user

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;

-- Add index for querying partial messages
CREATE INDEX IF NOT EXISTS idx_messages_is_partial ON messages(is_partial) WHERE is_partial = true;

-- Comment on the column
COMMENT ON COLUMN messages.is_partial IS 'Indicates if the message was stopped before completion';

