import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }

    // Get user to check if they're new
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user has subscription
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('plan_type')
        .eq('user_id', user.id)
        .single()

      // Valid plan types that grant access
      const validPlans = ['base', 'pro', 'power', 'founder', 'starter']
      const hasSubscription = userCredits?.plan_type && validPlans.includes(userCredits.plan_type)

      // Redirect based on subscription status
      if (hasSubscription) {
        return NextResponse.redirect(new URL('/chat', request.url))
      } else {
        // New user or no subscription - redirect to pricing
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/pricing', request.url))
}

