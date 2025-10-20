# User Settings Database Migration

## Overview
This migration creates the `user_settings` table to store user preferences for the PelicanAI trading assistant.

## Migration File
`008_create_user_settings_table.sql`

## How to Run

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `008_create_user_settings_table.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Using Supabase CLI
```bash
supabase db push --file scripts/008_create_user_settings_table.sql
```

## Table Schema

### `user_settings`
Stores user preferences and configuration settings.

#### Columns

**Trading Preferences:**
- `default_timeframes` (TEXT[]): Array of preferred timeframes (e.g., ['5m', '15m', '1h'])
- `preferred_markets` (TEXT[]): Array of markets user trades (e.g., ['stocks', 'options'])
- `risk_tolerance` (TEXT): User's risk profile - 'conservative', 'moderate', or 'aggressive'
- `default_position_size` (NUMERIC): Preferred position size
- `favorite_tickers` (TEXT[]): Array of frequently traded ticker symbols

**Notifications:**
- `email_notifications` (BOOLEAN): Enable/disable email notifications
- `market_alerts` (BOOLEAN): Market movement alerts
- `price_alerts` (BOOLEAN): Price target alerts
- `trade_confirmations` (BOOLEAN): Trade execution confirmations

**Chat Settings:**
- `auto_scroll` (TEXT): Chat auto-scroll behavior - 'always', 'when_at_bottom', or 'never'
- `message_density` (TEXT): Message display density - 'comfortable' or 'compact'
- `show_timestamps` (BOOLEAN): Show timestamps on messages

**Display Settings:**
- `theme` (TEXT): UI theme - 'light', 'dark', or 'system'
- `sidebar_collapsed_default` (BOOLEAN): Start with sidebar collapsed
- `market_panel_visible` (BOOLEAN): Show market overview panel
- `font_size` (TEXT): Font size - 'small', 'medium', or 'large'

**Metadata:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time (auto-updated via trigger)

## Security
Row Level Security (RLS) is enabled with policies ensuring:
- Users can only view their own settings
- Users can only insert/update/delete their own settings
- No cross-user data access

## Indexes
- `idx_user_settings_user_id`: Fast lookups by user_id

## Triggers
- `update_user_settings_updated_at`: Automatically updates the `updated_at` timestamp on every update

## Constraints
- One settings record per user (UNIQUE constraint on user_id)
- Foreign key cascade delete (deleting user deletes their settings)
- Check constraints on enum-like fields (theme, risk_tolerance, etc.)

## Default Values
All settings have sensible defaults:
- Default timeframes: ['5m', '15m', '1h']
- Preferred markets: ['stocks']
- Risk tolerance: 'moderate'
- All notifications: enabled
- Auto-scroll: 'when_at_bottom'
- Theme: 'system'
- Font size: 'medium'

## Rollback
To rollback this migration:
```sql
DROP TABLE IF EXISTS user_settings CASCADE;
DROP FUNCTION IF EXISTS update_user_settings_updated_at() CASCADE;
```

## Testing
After running the migration, verify:
1. Table exists: `SELECT * FROM user_settings LIMIT 1;`
2. RLS policies active: Try accessing as different user
3. Triggers work: Update a setting and check `updated_at` changes
4. Constraints enforced: Try inserting invalid values

## Notes
- Settings are optional - users can use the app without customizing settings
- If no settings exist for a user, the frontend uses DEFAULT_SETTINGS from the component
- Settings are lazy-loaded only when user visits /settings page
