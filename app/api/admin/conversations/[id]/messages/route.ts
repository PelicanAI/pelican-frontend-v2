import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { id: conversationId } = await params
  const admin = getServiceClient()

  const { data: messages, error } = await admin
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Admin Convo Messages] query failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] }, {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
