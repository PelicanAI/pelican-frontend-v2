-- Add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Add metadata column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create function to auto-update conversation timestamp and metadata
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    updated_at = NOW(),
    message_count = message_count + 1,
    last_message_preview = LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation metadata
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable RLS on both tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
DROP POLICY IF EXISTS "Users can only access their own conversations" ON conversations;
CREATE POLICY "Users can only access their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for messages
DROP POLICY IF EXISTS "Users can only access their own messages" ON messages;
CREATE POLICY "Users can only access their own messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
