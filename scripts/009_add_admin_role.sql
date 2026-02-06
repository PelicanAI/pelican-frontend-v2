-- =====================================================
-- Migration 009: Add Admin Role to user_credits
-- =====================================================
-- Adds is_admin boolean to user_credits table.
-- Admins must be set manually via SQL:
--   UPDATE user_credits SET is_admin = true WHERE user_id = 'your-user-uuid';
-- =====================================================

-- Add is_admin column (defaults to false for all existing and new users)
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_is_admin ON public.user_credits(is_admin) WHERE is_admin = true;
