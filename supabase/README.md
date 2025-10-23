# Supabase Database Scripts

This directory contains SQL scripts for setting up the Pelican Trading database schema, security policies, and test accounts.

## 📁 Files

### 1. `setup-database.sql`
**Purpose:** Creates the core database schema for conversations and messages with trading metadata support.

**What it does:**
- Creates `conversations` table (stores conversation metadata)
- Creates `messages` table (stores individual messages with trading metadata)
- Creates indexes for performance (including GIN index for JSONB queries)
- Sets up Row Level Security (RLS) policies
- Creates helper functions:
  - `get_trading_context()` - Retrieves messages by ticker or recent history
  - `get_user_positions()` - Returns all positions mentioned by a user
- Creates triggers for auto-updating timestamps

**When to run:** First, before any other setup

**How to run:**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/ewcqmsfaostcwmgybbub/sql)
2. Click "New Query"
3. Copy/paste entire file content
4. Click "RUN"

---

### 2. `setup-founder-accounts.sql`
**Purpose:** Instructions and queries for creating the three founder test accounts.

**Accounts to create:**
- nick@pelicantrading.ai
- jack@pelicantrading.ai
- ray@pelicantrading.ai

**Password:** TempPassword123! (for all accounts)

**When to run:** After `setup-database.sql`

**How to create accounts:**

**Method 1 (Recommended): Supabase Dashboard**
1. Go to [Authentication → Users](https://supabase.com/dashboard/project/ewcqmsfaostcwmgybbub/auth/users)
2. Click "Add User" → "Create new user"
3. Enter email and password
4. Check "Auto Confirm User"
5. Repeat for all 3 accounts

**Method 2: Supabase CLI**
```bash
npx supabase auth users create nick@pelicantrading.ai --password TempPassword123!
npx supabase auth users create jack@pelicantrading.ai --password TempPassword123!
npx supabase auth users create ray@pelicantrading.ai --password TempPassword123!
```

---

## 🔒 Security Notes

### Row Level Security (RLS)

All tables have RLS enabled with these policies:

**Conversations:**
- Users can only SELECT their own conversations
- Users can only INSERT conversations for themselves
- Users can only UPDATE their own conversations
- Users can only DELETE their own conversations

**Messages:**
- Users can only SELECT their own messages
- Users can only INSERT messages for themselves
- Users can only UPDATE their own messages
- Users can only DELETE their own messages

**Why this matters:**
- Prevents users from seeing each other's data
- Enforces data isolation at the database level
- Works even if application code has bugs

### API Access

The helper functions use `SECURITY DEFINER` to run with elevated privileges:
- `get_trading_context()` - Queries messages with special permissions
- `get_user_positions()` - Aggregates position data

These functions still respect user boundaries - they only return data for the specified user_id.

---

## 📊 Database Schema

### `conversations` Table
```sql
id                  UUID PRIMARY KEY
user_id            UUID REFERENCES auth.users(id)
title              TEXT
message_count      INTEGER DEFAULT 0
last_message_preview TEXT
created_at         TIMESTAMPTZ DEFAULT now()
updated_at         TIMESTAMPTZ DEFAULT now()
archived           BOOLEAN DEFAULT false
archived_at        TIMESTAMPTZ
metadata           JSONB DEFAULT '{}'
```

**Indexes:**
- `idx_conversations_user_id` (user_id)
- `idx_conversations_updated_at` (updated_at DESC)

---

### `messages` Table
```sql
id                 UUID PRIMARY KEY
conversation_id    UUID REFERENCES conversations(id)
user_id           UUID REFERENCES auth.users(id)
role              TEXT CHECK (role IN ('user', 'assistant', 'system'))
content           TEXT NOT NULL
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMPTZ DEFAULT now()
```

**Metadata Structure (JSONB):**
```json
{
  "tickers": ["NVDA", "AAPL"],
  "prices": [890, 175],
  "action": "buy",
  "quantities": ["100 shares", "50 shares"],
  "hasPosition": true,
  "hasStopLoss": false,
  "hasTarget": false
}
```

**Indexes:**
- `idx_messages_conversation_id` (conversation_id)
- `idx_messages_user_id` (user_id)
- `idx_messages_created_at` (created_at DESC)
- `idx_messages_metadata` (GIN index on metadata JSONB)

**Why GIN Index:**
- Enables fast queries like: "Find all messages mentioning NVDA"
- Supports JSONB operators: `?`, `?|`, `?&`, `@>`, `<@`
- Example: `WHERE metadata->'tickers' ?| ARRAY['NVDA', 'TSLA']`

---

## 🔍 Helper Functions

### `get_trading_context(user_id, tickers[], limit)`

**Purpose:** Retrieve relevant message history for a user.

**Parameters:**
- `p_user_id` (UUID): User to retrieve messages for
- `p_tickers` (TEXT[]): Optional array of tickers to filter by
- `p_limit` (INT): Max number of messages to return (default: 30)

**Returns:**
```sql
TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
```

**Usage:**
```sql
-- Get last 30 messages for user
SELECT * FROM get_trading_context('user-uuid-here', NULL, 30);

-- Get messages mentioning NVDA or TSLA
SELECT * FROM get_trading_context(
  'user-uuid-here',
  ARRAY['NVDA', 'TSLA'],
  30
);
```

---

### `get_user_positions(user_id)`

**Purpose:** Get summary of all tickers mentioned by a user.

**Parameters:**
- `p_user_id` (UUID): User to retrieve positions for

**Returns:**
```sql
TABLE (
  ticker TEXT,
  last_action TEXT,
  last_price NUMERIC,
  last_mentioned TIMESTAMPTZ
)
```

**Usage:**
```sql
SELECT * FROM get_user_positions('user-uuid-here');
```

**Example Output:**
```
ticker | last_action | last_price | last_mentioned
-------|-------------|------------|----------------
NVDA   | buy         | 890        | 2025-01-22 10:30:00
AAPL   | sell        | 175        | 2025-01-22 09:15:00
TSLA   | buy         | 242        | 2025-01-22 08:00:00
```

---

## 🧪 Testing Queries

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages');
```

### Check Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('conversations', 'messages');
```

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages');
```

### Check Founder Accounts
```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email LIKE '%pelicantrading.ai'
ORDER BY email;
```

### Test Metadata Extraction
```sql
-- After sending some messages, check metadata
SELECT
  content,
  metadata->'tickers' as tickers,
  metadata->'prices' as prices,
  metadata->>'action' as action
FROM messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'nick@pelicantrading.ai')
ORDER BY created_at DESC
LIMIT 5;
```

### Test Trading Context Function
```sql
-- Replace with actual user ID
SELECT * FROM get_trading_context(
  (SELECT id FROM auth.users WHERE email = 'nick@pelicantrading.ai'),
  ARRAY['NVDA'],
  10
);
```

---

## 🔄 Migration & Updates

### Adding New Columns

If you need to add columns later:

```sql
-- Add new column to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS new_column_name TEXT;

-- Add new column to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS new_column_name JSONB DEFAULT '{}'::jsonb;
```

### Modifying RLS Policies

```sql
-- Drop old policy
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Create new policy
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🐛 Troubleshooting

### Issue: RLS blocking queries

**Symptom:** Queries return 0 rows even though data exists

**Solution:** Check you're authenticated and querying your own data
```sql
-- Check current user
SELECT auth.uid();

-- Temporarily disable RLS for testing (DEV ONLY!)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable after testing:
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### Issue: GIN index not being used

**Symptom:** Slow queries on metadata searches

**Solution:** Check query plan
```sql
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE metadata->'tickers' ?| ARRAY['NVDA'];
```

Look for "Index Scan using idx_messages_metadata"

### Issue: Metadata not storing

**Symptom:** All metadata fields are empty

**Solution:** Check data types
```sql
-- Verify metadata column is JSONB
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name = 'metadata';
```

---

## 📚 Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [GIN Index Documentation](https://www.postgresql.org/docs/current/gin.html)

---

**Last Updated:** 2025-01-22
