-- =====================================================
-- Migration 010: Admin RLS Policies
-- =====================================================
-- Adds read-all policies for admin users on key tables.
-- Adds admin UPDATE on user_credits for manual adjustments.
-- Existing regular user policies are NOT modified.
-- =====================================================

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_credits WHERE user_id = auth.uid()),
    false
  );
$$;

-- =====================================================
-- conversations: admin can read all conversations
-- =====================================================
DROP POLICY IF EXISTS "admin_select_all_conversations" ON public.conversations;
CREATE POLICY "admin_select_all_conversations"
  ON public.conversations FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- messages: admin can read all messages
-- =====================================================
DROP POLICY IF EXISTS "admin_select_all_messages" ON public.messages;
CREATE POLICY "admin_select_all_messages"
  ON public.messages FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- user_credits: admin can read all + update for adjustments
-- =====================================================
DROP POLICY IF EXISTS "admin_select_all_user_credits" ON public.user_credits;
CREATE POLICY "admin_select_all_user_credits"
  ON public.user_credits FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_user_credits" ON public.user_credits;
CREATE POLICY "admin_update_user_credits"
  ON public.user_credits FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- user_settings: admin can read all settings
-- =====================================================
DROP POLICY IF EXISTS "admin_select_all_user_settings" ON public.user_settings;
CREATE POLICY "admin_select_all_user_settings"
  ON public.user_settings FOR SELECT
  USING (public.is_admin());
