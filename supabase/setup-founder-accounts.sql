-- =====================================================
-- Pelican Trading - Founder Accounts Setup
-- =====================================================
-- This script creates the three founder test accounts:
-- - nick@pelicantrading.ai
-- - jack@pelicantrading.ai
-- - ray@pelicantrading.ai
--
-- Password for all accounts: TempPassword123!
--
-- IMPORTANT: This is for DEVELOPMENT/TESTING only!
-- Do NOT use in production. Change passwords immediately after testing.
--
-- Run this script in your Supabase SQL Editor AFTER running setup-database.sql
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- METHOD 1: Using Supabase Auth API (Recommended)
-- =====================================================
-- Instead of directly inserting into auth.users, use the Supabase dashboard:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User"
-- 3. Create each account with the emails below
-- 4. Set password to: TempPassword123!
--
-- OR use the Supabase CLI:
-- supabase auth users create nick@pelicantrading.ai --password TempPassword123!
-- supabase auth users create jack@pelicantrading.ai --password TempPassword123!
-- supabase auth users create ray@pelicantrading.ai --password TempPassword123!

-- =====================================================
-- METHOD 2: Direct Database Insert (Alternative)
-- =====================================================
-- WARNING: This method bypasses Supabase Auth and may not work with all
-- Supabase configurations. Use Method 1 (Dashboard/CLI) if possible.

-- Note: Supabase uses different password hashing than standard PostgreSQL
-- The password hash below is for demonstration and may not work.
-- You'll need to get actual hashed passwords from Supabase.

-- For testing, you can create users via the Supabase Auth API instead:
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FOUNDER ACCOUNTS CREATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Please create the following accounts using one of these methods:';
  RAISE NOTICE '';
  RAISE NOTICE 'METHOD 1 (Recommended): Supabase Dashboard';
  RAISE NOTICE '  1. Go to: https://supabase.com/dashboard/project/ewcqmsfaostcwmgybbub/auth/users';
  RAISE NOTICE '  2. Click "Add User"';
  RAISE NOTICE '  3. Create accounts with these credentials:';
  RAISE NOTICE '';
  RAISE NOTICE '     Email: nick@pelicantrading.ai';
  RAISE NOTICE '     Password: TempPassword123!';
  RAISE NOTICE '';
  RAISE NOTICE '     Email: jack@pelicantrading.ai';
  RAISE NOTICE '     Password: TempPassword123!';
  RAISE NOTICE '';
  RAISE NOTICE '     Email: ray@pelicantrading.ai';
  RAISE NOTICE '     Password: TempPassword123!';
  RAISE NOTICE '';
  RAISE NOTICE 'METHOD 2: Supabase CLI';
  RAISE NOTICE '  Run these commands from your terminal:';
  RAISE NOTICE '    npx supabase auth users create nick@pelicantrading.ai --password TempPassword123!';
  RAISE NOTICE '    npx supabase auth users create jack@pelicantrading.ai --password TempPassword123!';
  RAISE NOTICE '    npx supabase auth users create ray@pelicantrading.ai --password TempPassword123!';
  RAISE NOTICE '';
  RAISE NOTICE 'METHOD 3: Sign Up via Frontend';
  RAISE NOTICE '  1. Go to your app signup page';
  RAISE NOTICE '  2. Create each account manually';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SECURITY WARNING';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'These accounts are for TESTING ONLY!';
  RAISE NOTICE 'Change passwords before going to production.';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify accounts were created

-- Check if founder accounts exist
DO $$
DECLARE
  nick_exists BOOLEAN;
  jack_exists BOOLEAN;
  ray_exists BOOLEAN;
BEGIN
  -- Check for accounts (this requires access to auth.users table)
  -- Note: You may need to run this as a superuser or use Supabase dashboard

  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'nick@pelicantrading.ai') INTO nick_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'jack@pelicantrading.ai') INTO jack_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'ray@pelicantrading.ai') INTO ray_exists;

  IF nick_exists THEN
    RAISE NOTICE '✓ Nick account exists';
  ELSE
    RAISE NOTICE '✗ Nick account not found - please create manually';
  END IF;

  IF jack_exists THEN
    RAISE NOTICE '✓ Jack account exists';
  ELSE
    RAISE NOTICE '✗ Jack account not found - please create manually';
  END IF;

  IF ray_exists THEN
    RAISE NOTICE '✓ Ray account exists';
  ELSE
    RAISE NOTICE '✗ Ray account not found - please create manually';
  END IF;

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot verify accounts - insufficient privileges';
    RAISE NOTICE 'Please verify manually in Supabase Dashboard';
END $$;

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================
-- Uncomment to create sample conversations for testing
-- Make sure to replace {NICK_USER_ID}, {JACK_USER_ID}, {RAY_USER_ID} with actual UUIDs

/*
-- Get user IDs first by running:
-- SELECT id, email FROM auth.users WHERE email LIKE '%pelicantrading.ai';

-- Sample conversation for Nick
DO $$
DECLARE
  nick_id UUID;
  conv_id UUID;
BEGIN
  -- Get Nick's user ID
  SELECT id INTO nick_id FROM auth.users WHERE email = 'nick@pelicantrading.ai';

  IF nick_id IS NOT NULL THEN
    -- Create sample conversation
    INSERT INTO conversations (user_id, title, created_at)
    VALUES (nick_id, 'NVDA Position Analysis', now() - interval '2 days')
    RETURNING id INTO conv_id;

    -- Add sample messages
    INSERT INTO messages (conversation_id, user_id, role, content, metadata, created_at)
    VALUES
      (conv_id, nick_id, 'user', 'I bought 100 shares of NVDA at $890',
       '{"tickers": ["NVDA"], "prices": [890], "action": "buy", "quantities": ["100 shares"]}'::jsonb,
       now() - interval '2 days'),
      (conv_id, nick_id, 'assistant', 'I''ve noted your NVDA position. You entered 100 shares at $890. What''s your target price?',
       '{"tickers": ["NVDA"]}'::jsonb,
       now() - interval '2 days');

    RAISE NOTICE 'Created sample conversation for Nick';
  END IF;
END $$;
*/
