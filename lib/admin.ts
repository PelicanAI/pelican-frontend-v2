import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

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

  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  // DEBUG — remove after fixing admin redirect
  console.log('[ADMIN DEBUG] user.id:', user.id)
  console.log('[ADMIN DEBUG] credits query result:', { data: credits, error: creditsError })
  console.log('[ADMIN DEBUG] is_admin value:', credits?.is_admin)
  console.log('[ADMIN DEBUG] will redirect?', !credits?.is_admin)

  if (!credits?.is_admin) {
    redirect('/chat')
  }

  return { user, displayName: user.email ?? null }
}
