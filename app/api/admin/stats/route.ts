import { NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const admin = getServiceClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [usersResult, convosResult, activeResult, creditsResult] = await Promise.all([
    admin.from('user_credits').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('user_id').gte('created_at', oneDayAgo),
    admin.from('user_credits').select('credits_used_this_month, plan_type'),
  ])

  if (usersResult.error) console.error('[Admin Stats API] user_credits query failed:', usersResult.error.message)
  if (convosResult.error) console.error('[Admin Stats API] conversations query failed:', convosResult.error.message)
  if (activeResult.error) console.error('[Admin Stats API] active conversations query failed:', activeResult.error.message)
  if (creditsResult.error) console.error('[Admin Stats API] credits query failed:', creditsResult.error.message)

  const totalUsers = usersResult.count ?? 0
  const totalConversations = convosResult.count ?? 0
  const recentConvos = activeResult.data ?? []
  const creditStats = creditsResult.data ?? []

  // Count distinct user_ids from conversations in last 24h
  const activeUserIds = new Set((recentConvos ?? []).map((c) => c.user_id))
  const activeUsersToday = activeUserIds.size

  let totalCreditsUsed = 0
  const planBreakdown: Record<string, number> = {}

  if (creditStats) {
    for (const row of creditStats) {
      totalCreditsUsed += row.credits_used_this_month ?? 0
      const plan = row.plan_type ?? 'none'
      planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1
    }
  }

  return NextResponse.json({
    totalUsers,
    activeUsersToday,
    totalConversations,
    totalCreditsUsed,
    planBreakdown,
  }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
