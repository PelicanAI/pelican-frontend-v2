import { NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

function getLast30Days() {
  const days: string[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }
  return days
}

function bucketByDay(rows: { created_at: string }[], days: string[]) {
  const buckets = new Map<string, number>()
  for (const day of days) buckets.set(day, 0)
  for (const row of rows) {
    const day = row.created_at.split('T')[0]!
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1)
  }
  return days.map((d) => ({ date: d, count: buckets.get(d) ?? 0 }))
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const admin = getServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const days = getLast30Days()

  // Run all queries in parallel
  const [
    convosResult,
    authResult,
    messagesResult,
    userMessagesResult,
    creditsResult,
    msgUserIdsResult,
  ] = await Promise.all([
    admin.from('conversations').select('created_at').gte('created_at', thirtyDaysAgo),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('messages').select('created_at').gte('created_at', thirtyDaysAgo),
    admin.from('messages').select('created_at').gte('created_at', thirtyDaysAgo).eq('role', 'user'),
    admin.from('user_credits').select('user_id, plan_type, credits_balance, credits_used_this_month, free_questions_remaining'),
    admin.from('messages').select('user_id'),
  ])

  // Log errors
  if (convosResult.error) console.error('[Analytics] conversations:', convosResult.error.message)
  if (authResult.error) console.error('[Analytics] auth:', authResult.error.message)
  if (messagesResult.error) console.error('[Analytics] messages:', messagesResult.error.message)
  if (creditsResult.error) console.error('[Analytics] credits:', creditsResult.error.message)

  const authUsers = authResult.data?.users ?? []
  const creditsData = creditsResult.data ?? []

  // --- Time series ---
  const daily_conversations_30d = bucketByDay(convosResult.data ?? [], days)
  const daily_signups_30d = (() => {
    const buckets = new Map<string, number>()
    for (const day of days) buckets.set(day, 0)
    for (const u of authUsers) {
      const day = u.created_at.split('T')[0]!
      if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1)
    }
    return days.map((d) => ({ date: d, count: buckets.get(d) ?? 0 }))
  })()
  const daily_messages_30d = bucketByDay(messagesResult.data ?? [], days)

  // Credits per day — approximate via user messages (each user msg ≈ 1 credit)
  const daily_credits_30d = (() => {
    const buckets = new Map<string, number>()
    for (const day of days) buckets.set(day, 0)
    for (const m of (userMessagesResult.data ?? [])) {
      const day = (m.created_at as string).split('T')[0]!
      if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1)
    }
    return days.map((d) => ({ date: d, total_used: buckets.get(d) ?? 0 }))
  })()

  // --- Plan distribution ---
  const planCounts: Record<string, number> = {}
  for (const row of creditsData) {
    const plan = (row.plan_type as string) ?? 'none'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }
  const plan_distribution = Object.entries(planCounts)
    .map(([plan, count]) => ({ plan, count }))
    .sort((a, b) => b.count - a.count)

  // --- Top tickers (try — column may not exist) ---
  let top_tickers_30d: { ticker: string; count: number }[] = []
  try {
    const { data: tickerRows } = await admin
      .from('messages')
      .select('tickers')
      .gte('created_at', thirtyDaysAgo)
      .not('tickers', 'is', null)
    if (tickerRows && tickerRows.length > 0) {
      const tickerCounts = new Map<string, number>()
      for (const row of tickerRows) {
        const tickers = row.tickers as string[] | null
        if (!Array.isArray(tickers)) continue
        for (const t of tickers) {
          tickerCounts.set(t, (tickerCounts.get(t) ?? 0) + 1)
        }
      }
      top_tickers_30d = [...tickerCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([ticker, count]) => ({ ticker, count }))
    }
  } catch {
    // tickers column may not exist — ignore
  }

  // --- User activity distribution ---
  const userMsgCounts = new Map<string, number>()
  for (const m of (msgUserIdsResult.data ?? [])) {
    const uid = m.user_id as string
    userMsgCounts.set(uid, (userMsgCounts.get(uid) ?? 0) + 1)
  }
  const totalUserIds = new Set(creditsData.map((c) => c.user_id as string))
  const bucketDef = [
    { bucket: '0', min: 0, max: 0 },
    { bucket: '1-10', min: 1, max: 10 },
    { bucket: '11-50', min: 11, max: 50 },
    { bucket: '51-100', min: 51, max: 100 },
    { bucket: '100+', min: 101, max: Infinity },
  ]
  const user_activity_distribution = bucketDef.map(({ bucket, min, max }) => {
    let count = 0
    for (const uid of totalUserIds) {
      const msgs = userMsgCounts.get(uid) ?? 0
      if (msgs >= min && msgs <= max) count++
    }
    return { bucket, count }
  })

  // --- Conversion funnel ---
  const total_signups = authUsers.length
  let active_trial = 0
  let converted_paid = 0
  let churned = 0
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000

  for (const row of creditsData) {
    const plan = (row.plan_type as string | null) ?? 'none'
    const freeQ = (row.free_questions_remaining as number) ?? 0
    const userId = row.user_id as string
    const authUser = authUsers.find((u) => u.id === userId)

    if (plan === 'trial' || (plan === 'none' && freeQ > 0)) {
      active_trial++
    } else if (plan !== 'none' && plan !== 'trial' && plan !== null) {
      converted_paid++
    } else if (
      (plan === 'none' || !plan) &&
      freeQ === 0 &&
      authUser &&
      new Date(authUser.created_at).getTime() < sevenDaysAgoMs
    ) {
      churned++
    }
  }
  const conversion_funnel = { total_signups, active_trial, converted_paid, churned }

  // --- MRR ---
  const planPrices: Record<string, number> = {
    base: 29, starter: 29, pro: 99, power: 249, founder: 0,
  }
  let mrr = 0
  for (const row of creditsData) {
    const plan = (row.plan_type as string) ?? 'none'
    if (plan in planPrices) mrr += planPrices[plan]!
  }

  return NextResponse.json({
    daily_conversations_30d,
    daily_signups_30d,
    daily_messages_30d,
    daily_credits_30d,
    plan_distribution,
    top_tickers_30d,
    user_activity_distribution,
    conversion_funnel,
    mrr,
  }, {
    headers: { 'Cache-Control': 'private, no-cache' },
  })
}
