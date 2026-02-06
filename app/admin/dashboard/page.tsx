export const dynamic = 'force-dynamic'

import { Users, Activity, MessageSquare, Coins } from 'lucide-react'
import { getServiceClient } from '@/lib/admin'
import { StatsCard } from '@/components/admin/StatsCard'
import { RecentSignups } from '@/components/admin/RecentSignups'
import { RecentConversations } from '@/components/admin/RecentConversations'

export default async function AdminDashboardPage() {
  const admin = getServiceClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    usersResult,
    convosResult,
    activeResult,
    creditsResult,
    recentConvosResult,
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

  // Log any query errors for Vercel runtime diagnostics
  if (usersResult.error) console.error('[Admin Dashboard] user_credits count query failed:', usersResult.error.message)
  if (convosResult.error) console.error('[Admin Dashboard] conversations count query failed:', convosResult.error.message)
  if (activeResult.error) console.error('[Admin Dashboard] active conversations query failed:', activeResult.error.message)
  if (creditsResult.error) console.error('[Admin Dashboard] credits stats query failed:', creditsResult.error.message)
  if (recentConvosResult.error) console.error('[Admin Dashboard] recent conversations query failed:', recentConvosResult.error.message)

  const totalUsers = usersResult.count ?? 0
  const totalConversations = convosResult.count ?? 0
  const activeUserIds = new Set((activeResult.data ?? []).map((c) => c.user_id))
  const activeUsersToday = activeUserIds.size
  const creditStats = creditsResult.data ?? []
  const totalCreditsUsed = creditStats.reduce(
    (sum, r) => sum + (r.credits_used_this_month ?? 0),
    0
  )

  // Build credit plan lookup for recent signups
  const creditPlanMap = new Map(
    creditStats.map((c) => [c.user_id as string, c.plan_type as string])
  )

  // Recent signups from auth.users
  let signups: { id: string; displayName: string | null; email: string; createdAt: string; plan: string }[] = []
  try {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (authError) console.error('[Admin Dashboard] listUsers failed:', authError.message)

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
  const recentConvos = recentConvosResult.data ?? []
  let conversations: { id: string; title: string | null; userName: string | null; createdAt: string }[] = []
  try {
    const convoUserIds = [...new Set(recentConvos.map((c) => c.user_id as string))]
    let userEmailMap = new Map<string, string | null>()

    if (convoUserIds.length > 0) {
      const { data: convoAuthData, error: convoAuthError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (convoAuthError) console.error('[Admin Dashboard] listUsers for convos failed:', convoAuthError.message)
      userEmailMap = new Map(
        (convoAuthData?.users ?? []).map((u) => [u.id, u.email ?? null])
      )
    }

    conversations = recentConvos.map((c) => ({
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
        <StatsCard title="Total Users" value={totalUsers} icon={Users} />
        <StatsCard title="Active Today" value={activeUsersToday} icon={Activity} />
        <StatsCard title="Total Conversations" value={totalConversations} icon={MessageSquare} />
        <StatsCard title="Credits Used (Month)" value={totalCreditsUsed} icon={Coins} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentSignups users={signups} />
        <RecentConversations conversations={conversations} />
      </div>
    </div>
  )
}
