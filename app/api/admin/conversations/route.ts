import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10')), 50)
  const cursor = searchParams.get('cursor') || ''

  const admin = getServiceClient()

  let query = admin
    .from('conversations')
    .select('id, title, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Admin Conversations] query failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }

  const rows = data ?? []

  // Resolve user emails
  const userIds = [...new Set(rows.map((c) => c.user_id as string))]
  let userEmailMap = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userEmailMap = new Map(
      (authData?.users ?? []).map((u) => [u.id, u.email ?? null])
    )
  }

  const conversations = rows.map((c) => ({
    id: c.id as string,
    title: c.title as string | null,
    userName: userEmailMap.get(c.user_id as string) ?? null,
    createdAt: c.created_at as string,
  }))

  return NextResponse.json({
    conversations,
    hasMore: rows.length === limit,
  }, {
    headers: { 'Cache-Control': 'private, no-cache' },
  })
}
