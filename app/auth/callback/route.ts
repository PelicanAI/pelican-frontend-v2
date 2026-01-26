import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    console.log('[AUTH CALLBACK] Starting callback flow', { hasCode: !!code, url: requestUrl.toString() })

    if (code) {
      const supabase = await createClient()
      
      // Exchange code for session
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('[AUTH CALLBACK] exchangeCodeForSession result', {
        hasError: !!exchangeError,
        error: exchangeError?.message,
        hasSession: !!sessionData?.session,
        hasUser: !!sessionData?.user,
        userId: sessionData?.user?.id
      })
      
      if (exchangeError) {
        console.error('[AUTH CALLBACK] Exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      // Verify session was actually created
      if (!sessionData?.session) {
        console.error('[AUTH CALLBACK] No session returned from exchangeCodeForSession')
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      // Get user to check if they're new
      // Use the user from sessionData first, fallback to getUser()
      let user: User | null = sessionData.user
      if (!user) {
        const { data: { user: fetchedUser }, error: getUserError } = await supabase.auth.getUser()
        console.log('[AUTH CALLBACK] getUser() result', {
          hasError: !!getUserError,
          error: getUserError?.message,
          hasUser: !!fetchedUser,
          userId: fetchedUser?.id
        })
        
        if (getUserError) {
          console.error('[AUTH CALLBACK] getUser() error:', getUserError)
          return NextResponse.redirect(`${origin}/auth/error`)
        }
        user = fetchedUser || null
      }
      
      if (!user) {
        console.error('[AUTH CALLBACK] No user found after exchangeCodeForSession')
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      console.log('[AUTH CALLBACK] User authenticated', { userId: user.id, email: user.email })

      // Check if user has subscription
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('plan_type')
        .eq('user_id', user.id)
        .single()

      console.log('[AUTH CALLBACK] user_credits query result', {
        hasError: !!creditsError,
        error: creditsError?.message,
        planType: userCredits?.plan_type,
        hasUserCredits: !!userCredits
      })

      // Valid plan types that grant access
      const validPlans = ['base', 'pro', 'power', 'founder', 'starter']
      const hasSubscription = userCredits?.plan_type && validPlans.includes(userCredits.plan_type)

      console.log('[AUTH CALLBACK] Redirect decision', {
        hasSubscription,
        planType: userCredits?.plan_type,
        redirectTo: hasSubscription ? '/chat' : '/pricing'
      })

      // Redirect based on subscription status
      if (hasSubscription) {
        return NextResponse.redirect(new URL('/chat', request.url))
      } else {
        // New user or no subscription - redirect to pricing
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }

    // No code provided - this shouldn't happen for OAuth, but handle gracefully
    console.warn('[AUTH CALLBACK] No code parameter provided')
    return NextResponse.redirect(new URL('/pricing', request.url))
  } catch (error) {
    console.error('[AUTH CALLBACK] Unhandled error:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}

