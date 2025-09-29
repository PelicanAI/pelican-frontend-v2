-- Add archived field to conversations table for conversation management
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering archived conversations
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);

-- Add index for user conversations filtering
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived ON conversations(user_id, archived);
