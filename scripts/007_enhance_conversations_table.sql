-- Add missing timestamp columns for soft deletion and archiving
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create indexes for efficient filtering and searching
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived 
ON conversations(user_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_conversations_user_deleted 
ON conversations(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_conversations_user_title 
ON conversations(user_id, title);

-- Update existing archived conversations to have archived_at timestamp
UPDATE conversations 
SET archived_at = updated_at 
WHERE archived = true AND archived_at IS NULL;

-- Create function to update conversation updated_at on message insert
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
