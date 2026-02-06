export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { AnalyticsChart } from '@/components/admin/AnalyticsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getLast30Days() {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }
  return days
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function AdminAnalyticsPage() {
  const admin = getServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const days = getLast30Days()

  const [{ data: recentConvos }, { data: authData }, { data: planData }] =
    await Promise.all([
      admin
        .from('conversations')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('user_credits').select('plan_type'),
    ])

  // Bucket conversations by day
  const convoBuckets = new Map<string, number>()
  for (const day of days) convoBuckets.set(day, 0)
  for (const c of recentConvos ?? []) {
    const day = (c.created_at as string).split('T')[0]!
    convoBuckets.set(day, (convoBuckets.get(day) ?? 0) + 1)
  }

  // Bucket signups by day (from auth.users created_at)
  const signupBuckets = new Map<string, number>()
  for (const day of days) signupBuckets.set(day, 0)
  for (const u of authData?.users ?? []) {
    const day = u.created_at.split('T')[0]!
    if (signupBuckets.has(day)) {
      signupBuckets.set(day, (signupBuckets.get(day) ?? 0) + 1)
    }
  }

  const convoData = days.map((d) => ({
    label: formatDayLabel(d),
    value: convoBuckets.get(d) ?? 0,
  }))

  const signupData = days.map((d) => ({
    label: formatDayLabel(d),
    value: signupBuckets.get(d) ?? 0,
  }))

  // Plan distribution
  const planCounts: Record<string, number> = {}
  for (const row of planData ?? []) {
    const plan = (row.plan_type as string) ?? 'none'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }
  const planEntries = Object.entries(planCounts).sort((a, b) => b[1] - a[1])
  const totalPlanUsers = planEntries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart title="Conversations (Last 30 Days)" data={convoData} />
        <AnalyticsChart title="Signups (Last 30 Days)" data={signupData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {planEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-3">
              {planEntries.map(([plan, count]) => {
                const pct = totalPlanUsers > 0 ? (count / totalPlanUsers) * 100 : 0
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{plan}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
