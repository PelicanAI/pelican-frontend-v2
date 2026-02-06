import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100)
  const search = (searchParams.get('search') || '').toLowerCase().trim()
  const planFilter = (searchParams.get('plan') || '').toLowerCase().trim()
  const sortBy = (searchParams.get('sort') || 'newest').toLowerCase().trim()

  const admin = getServiceClient()

  // Get all auth users
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (authError) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const authUsers = authData.users ?? []
  const allUserIds = authUsers.map((u) => u.id)

  // Fetch credit info for ALL users (needed for filtering/sorting)
  let allCredits: Record<string, unknown>[] = []
  if (allUserIds.length > 0) {
    const { data, error } = await admin
      .from('user_credits')
      .select('user_id, credits_balance, plan_type, credits_used_this_month, free_questions_remaining, is_admin')
      .in('user_id', allUserIds)
    if (error) console.error('[Admin Users API] credits query failed:', error.message)
    allCredits = data ?? []
  }

  const creditMap = new Map(
    allCredits.map((c) => [c.user_id as string, c])
  )

  // Fetch message counts per user for "most_active" sort
  const userMsgCounts = new Map<string, number>()
  if (sortBy === 'most_active') {
    const { data: msgData } = await admin.from('messages').select('user_id')
    if (msgData) {
      for (const m of msgData) {
        const uid = m.user_id as string
        userMsgCounts.set(uid, (userMsgCounts.get(uid) ?? 0) + 1)
      }
    }
  }

  // Build merged user list
  let merged = authUsers.map((u) => {
    const credit = creditMap.get(u.id) as Record<string, unknown> | undefined
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
      messageCount: userMsgCounts.get(u.id) ?? 0,
    }
  })

  // Filter by search
  if (search) {
    merged = merged.filter((u) =>
      (u.email).toLowerCase().includes(search) ||
      (u.displayName ?? '').toLowerCase().includes(search)
    )
  }

  // Filter by plan
  if (planFilter && planFilter !== 'all') {
    merged = merged.filter((u) => u.plan === planFilter)
  }

  // Sort
  switch (sortBy) {
    case 'oldest':
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    case 'most_credits':
      merged.sort((a, b) => b.creditsBalance - a.creditsBalance)
      break
    case 'least_credits':
      merged.sort((a, b) => a.creditsBalance - b.creditsBalance)
      break
    case 'most_active':
      merged.sort((a, b) => b.messageCount - a.messageCount)
      break
    default: // newest
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = merged.length
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit
  const pageUsers = merged.slice(offset, offset + limit)

  // Strip messageCount from response (internal sort field)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const users = pageUsers.map(({ messageCount: _mc, ...rest }) => rest)

  return NextResponse.json({ users, total, page, limit, totalPages }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
