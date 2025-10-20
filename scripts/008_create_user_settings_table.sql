-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trading Preferences
  default_timeframes TEXT[] DEFAULT ARRAY['5m', '15m', '1h'],
  preferred_markets TEXT[] DEFAULT ARRAY['stocks'],
  risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  default_position_size NUMERIC,
  favorite_tickers TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  market_alerts BOOLEAN DEFAULT TRUE,
  price_alerts BOOLEAN DEFAULT TRUE,
  trade_confirmations BOOLEAN DEFAULT TRUE,

  -- Chat Settings
  auto_scroll TEXT DEFAULT 'when_at_bottom' CHECK (auto_scroll IN ('always', 'when_at_bottom', 'never')),
  message_density TEXT DEFAULT 'comfortable' CHECK (message_density IN ('comfortable', 'compact')),
  show_timestamps BOOLEAN DEFAULT TRUE,

  -- Display Settings
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed_default BOOLEAN DEFAULT FALSE,
  market_panel_visible BOOLEAN DEFAULT TRUE,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences and settings for the PelicanAI trading assistant';
