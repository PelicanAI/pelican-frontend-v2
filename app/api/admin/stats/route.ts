import { NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const admin = getServiceClient()
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    usersResult,
    convosResult,
    activeResult,
    creditsResult,
    messagesTodayResult,
    messagesWeekResult,
    messages30dResult,
  ] = await Promise.all([
    admin.from('user_credits').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('user_id').gte('created_at', oneDayAgo),
    admin.from('user_credits').select('credits_balance, credits_used_this_month, plan_type'),
    admin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    admin.from('messages').select('created_at').gte('created_at', thirtyDaysAgo),
  ])

  if (usersResult.error) console.error('[Admin Stats API] user_credits query failed:', usersResult.error.message)
  if (convosResult.error) console.error('[Admin Stats API] conversations query failed:', convosResult.error.message)
  if (activeResult.error) console.error('[Admin Stats API] active conversations query failed:', activeResult.error.message)
  if (creditsResult.error) console.error('[Admin Stats API] credits query failed:', creditsResult.error.message)
  if (messagesTodayResult.error) console.error('[Admin Stats API] messages today query failed:', messagesTodayResult.error.message)
  if (messagesWeekResult.error) console.error('[Admin Stats API] messages week query failed:', messagesWeekResult.error.message)
  if (messages30dResult.error) console.error('[Admin Stats API] messages 30d query failed:', messages30dResult.error.message)

  const totalUsers = usersResult.count ?? 0
  const totalConversations = convosResult.count ?? 0
  const activeUserIds = new Set((activeResult.data ?? []).map((c) => c.user_id))
  const activeUsersToday = activeUserIds.size
  const credits = creditsResult.data ?? []
  const messagesThisWeek = messagesWeekResult.count ?? 0
  const messagesToday = messagesTodayResult.count ?? 0

  let totalCreditsUsed = 0
  let creditsRemainingTotal = 0
  let usersLowCredits = 0
  const planBreakdown: Record<string, number> = {}

  for (const row of credits) {
    totalCreditsUsed += row.credits_used_this_month ?? 0
    creditsRemainingTotal += row.credits_balance ?? 0
    const plan = row.plan_type ?? 'none'
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1
    // Low credits: paid users with balance < 50
    if (plan !== 'none' && plan !== 'trial' && (row.credits_balance ?? 0) < 50) {
      usersLowCredits++
    }
  }

  const avgCreditsPerUser = totalUsers > 0 ? Math.round(creditsRemainingTotal / totalUsers) : 0

  // Daily messages for last 30 days (for chart)
  const dayBuckets = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayBuckets.set(d.toISOString().split('T')[0]!, 0)
  }
  for (const m of messages30dResult.data ?? []) {
    const day = (m.created_at as string).split('T')[0]!
    if (dayBuckets.has(day)) {
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1)
    }
  }
  const dailyMessages30d = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }))

  // Top 5 active users by message count in last 7 days
  let topActiveUsers: { email: string; count: number }[] = []
  try {
    const { data: weekMessages, error: weekErr } = await admin
      .from('messages')
      .select('user_id')
      .gte('created_at', sevenDaysAgo)
    if (weekErr) console.error('[Admin Stats API] top users query failed:', weekErr.message)

    const userMsgCounts = new Map<string, number>()
    for (const m of weekMessages ?? []) {
      const uid = m.user_id as string
      userMsgCounts.set(uid, (userMsgCounts.get(uid) ?? 0) + 1)
    }
    const topUserIds = [...userMsgCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    if (topUserIds.length > 0) {
      const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? 'unknown']))
      topActiveUsers = topUserIds.map(([uid, count]) => ({
        email: emailMap.get(uid) ?? 'unknown',
        count,
      }))
    }
  } catch (e) {
    console.error('[Admin Stats API] Failed to compute top users:', e)
  }

  return NextResponse.json({
    totalUsers,
    activeUsersToday,
    totalConversations,
    totalCreditsUsed,
    creditsRemainingTotal,
    avgCreditsPerUser,
    usersLowCredits,
    messagesToday,
    messagesThisWeek,
    topActiveUsers,
    planBreakdown,
    dailyMessages30d,
  }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
