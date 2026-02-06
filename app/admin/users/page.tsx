export const dynamic = 'force-dynamic'

import { getServiceClient } from '@/lib/admin'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const admin = getServiceClient()
  const limit = 20

  // Get auth users for the first page
  let allUsers: { id: string; email?: string; created_at: string }[] = []
  try {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (authError) console.error('[Admin Users] listUsers failed:', authError.message)
    allUsers = (authData?.users ?? [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (e) {
    console.error('[Admin Users] Failed to fetch auth users:', e)
  }

  const total = allUsers.length
  const pageUsers = allUsers.slice(0, limit)
  const totalPages = Math.ceil(total / limit)

  // Fetch credit info for this page's users
  const userIds = pageUsers.map((u) => u.id)
  let credits: Record<string, unknown>[] = []
  if (userIds.length > 0) {
    const { data, error } = await admin
      .from('user_credits')
      .select('user_id, credits_balance, plan_type, credits_used_this_month, free_questions_remaining, is_admin')
      .in('user_id', userIds)
    if (error) console.error('[Admin Users] credits query failed:', error.message)
    credits = data ?? []
  }

  const creditMap = new Map(
    credits.map((c) => [c.user_id as string, c])
  )

  const users = pageUsers.map((u) => {
    const credit = creditMap.get(u.id)
    return {
      id: u.id,
      displayName: u.email ?? null,
      email: u.email ?? '',
      createdAt: u.created_at,
      isAdmin: ((credit as Record<string, unknown>)?.is_admin ?? false) as boolean,
      plan: ((credit as Record<string, unknown>)?.plan_type ?? 'none') as string,
      creditsBalance: ((credit as Record<string, unknown>)?.credits_balance ?? 0) as number,
      creditsUsed: ((credit as Record<string, unknown>)?.credits_used_this_month ?? 0) as number,
      freeQuestionsRemaining: ((credit as Record<string, unknown>)?.free_questions_remaining ?? 0) as number,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <UsersTable
        initialData={{
          users,
          total,
          page: 1,
          limit,
          totalPages,
        }}
      />
    </div>
  )
}
