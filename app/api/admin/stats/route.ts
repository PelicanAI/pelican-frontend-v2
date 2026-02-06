import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const admin = getServiceClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: totalConversations },
    { data: recentConvos },
    { data: creditStats },
  ] = await Promise.all([
    admin.from('user_credits').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('*', { count: 'exact', head: true }),
    admin
      .from('conversations')
      .select('user_id')
      .gte('created_at', oneDayAgo),
    admin
      .from('user_credits')
      .select('credits_used_this_month, plan_type'),
  ])

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
    totalUsers: totalUsers ?? 0,
    activeUsersToday,
    totalConversations: totalConversations ?? 0,
    totalCreditsUsed,
    planBreakdown,
  }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
