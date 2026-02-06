export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { Users, Activity, MessageSquare, Coins } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { RecentSignups } from '@/components/admin/RecentSignups'
import { RecentConversations } from '@/components/admin/RecentConversations'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars for admin')
  return createClient(url, key)
}

export default async function AdminDashboardPage() {
  const admin = getServiceClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: totalConversations },
    { data: recentActiveConvos },
    { data: creditStats },
    { data: recentConvos },
  ] = await Promise.all([
    admin.from('user_credits').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('*', { count: 'exact', head: true }),
    admin.from('conversations').select('user_id').gte('created_at', oneDayAgo),
    admin.from('user_credits').select('credits_used_this_month, plan_type, user_id'),
    admin
      .from('conversations')
      .select('id, title, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const activeUserIds = new Set((recentActiveConvos ?? []).map((c) => c.user_id))
  const activeUsersToday = activeUserIds.size
  const totalCreditsUsed = (creditStats ?? []).reduce(
    (sum, r) => sum + (r.credits_used_this_month ?? 0),
    0
  )

  // Build credit plan lookup for recent signups
  const creditPlanMap = new Map(
    (creditStats ?? []).map((c) => [c.user_id as string, c.plan_type as string])
  )

  // Recent signups from auth.users
  let signups: { id: string; displayName: string | null; email: string; createdAt: string; plan: string }[] = []
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const recentAuthUsers = (authData?.users ?? [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    signups = recentAuthUsers.map((u) => ({
      id: u.id,
      displayName: u.email ?? null,
      email: u.email ?? '',
      createdAt: u.created_at,
      plan: creditPlanMap.get(u.id) ?? 'none',
    }))
  } catch (e) {
    console.error('[Admin Dashboard] Failed to fetch auth users:', e)
  }

  // Resolve user emails for recent conversations
  let conversations: { id: string; title: string | null; userName: string | null; createdAt: string }[] = []
  try {
    const convoUserIds = [...new Set((recentConvos ?? []).map((c) => c.user_id as string))]
    let userEmailMap = new Map<string, string | null>()

    if (convoUserIds.length > 0) {
      const { data: convoAuthData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      userEmailMap = new Map(
        (convoAuthData?.users ?? []).map((u) => [u.id, u.email ?? null])
      )
    }

    conversations = (recentConvos ?? []).map((c) => ({
      id: c.id as string,
      title: c.title as string | null,
      userName: userEmailMap.get(c.user_id as string) ?? null,
      createdAt: c.created_at as string,
    }))
  } catch (e) {
    console.error('[Admin Dashboard] Failed to resolve conversation users:', e)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={totalUsers ?? 0} icon={Users} />
        <StatsCard title="Active Today" value={activeUsersToday} icon={Activity} />
        <StatsCard title="Total Conversations" value={totalConversations ?? 0} icon={MessageSquare} />
        <StatsCard title="Credits Used (Month)" value={totalCreditsUsed} icon={Coins} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentSignups users={signups} />
        <RecentConversations conversations={conversations} />
      </div>
    </div>
  )
}
