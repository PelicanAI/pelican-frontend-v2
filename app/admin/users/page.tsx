export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { UsersTable } from '@/components/admin/UsersTable'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminUsersPage() {
  const admin = getServiceClient()
  const limit = 20

  // Get auth users for the first page
  const { data: authData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  const allUsers = (authData?.users ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const total = allUsers.length
  const pageUsers = allUsers.slice(0, limit)
  const totalPages = Math.ceil(total / limit)

  // Fetch credit info for this page's users
  const userIds = pageUsers.map((u) => u.id)
  const { data: credits } = userIds.length > 0
    ? await admin
        .from('user_credits')
        .select('user_id, credits_balance, plan_type, credits_used_this_month, free_questions_remaining, is_admin')
        .in('user_id', userIds)
    : { data: [] }

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
      isAdmin: (credit?.is_admin ?? false) as boolean,
      plan: (credit?.plan_type ?? 'none') as string,
      creditsBalance: (credit?.credits_balance ?? 0) as number,
      creditsUsed: (credit?.credits_used_this_month ?? 0) as number,
      freeQuestionsRemaining: (credit?.free_questions_remaining ?? 0) as number,
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
