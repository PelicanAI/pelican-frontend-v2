import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

/**
 * Service-role Supabase client for admin data queries (bypasses RLS).
 * Validates env vars at runtime — throws with a clear message if missing.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ')
    console.error(`[Admin] Missing env vars: ${missing}`)
    throw new Error(`Missing Supabase env vars for admin: ${missing}`)
  }

  return createSupabaseClient(url, key)
}

/**
 * Verify the current user is an admin (for API routes).
 * Returns { supabase, user } on success, or a NextResponse error.
 */
export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (creditsError || !credits?.is_admin) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user }
}

/**
 * Verify the current user is an admin (for Server Components / layouts).
 * Redirects non-admins to /chat.
 */
export async function requireAdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/admin/dashboard')
  }

  const { data: credits } = await supabase
    .from('user_credits')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!credits?.is_admin) {
    redirect('/chat')
  }

  return { user, displayName: user.email ?? null }
}
