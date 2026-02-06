import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100)
  const search = (searchParams.get('search') || '').toLowerCase().trim()

  const admin = getServiceClient()

  // Get all auth users (email, created_at, last_sign_in_at)
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (authError) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  let authUsers = authData.users ?? []

  // Filter by search (email)
  if (search) {
    authUsers = authUsers.filter((u) =>
      (u.email ?? '').toLowerCase().includes(search)
    )
  }

  // Sort by created_at descending
  authUsers.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const total = authUsers.length
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit
  const pageUsers = authUsers.slice(offset, offset + limit)

  if (pageUsers.length === 0) {
    return NextResponse.json({ users: [], total, page, limit, totalPages })
  }

  // Fetch credit info for this page's users
  const userIds = pageUsers.map((u) => u.id)
  const { data: credits, error: creditsError } = await admin
    .from('user_credits')
    .select('user_id, credits_balance, plan_type, credits_used_this_month, free_questions_remaining, is_admin')
    .in('user_id', userIds)
  if (creditsError) console.error('[Admin Users API] credits query failed:', creditsError.message)

  const creditMap = new Map(
    (credits ?? []).map((c) => [c.user_id as string, c])
  )

  const users = pageUsers.map((u) => {
    const credit = creditMap.get(u.id)
    return {
      id: u.id,
      displayName: u.email ?? null,
      email: u.email ?? '',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      isAdmin: (credit?.is_admin ?? false) as boolean,
      plan: (credit?.plan_type ?? 'none') as string,
      creditsBalance: (credit?.credits_balance ?? 0) as number,
      creditsUsed: (credit?.credits_used_this_month ?? 0) as number,
      freeQuestionsRemaining: (credit?.free_questions_remaining ?? 0) as number,
    }
  })

  return NextResponse.json({ users, total, page, limit, totalPages }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
