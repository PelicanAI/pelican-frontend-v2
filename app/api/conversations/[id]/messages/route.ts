import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: conversationId } = await params
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query messages table using conversation UUID
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)  // Use conversation UUID directly
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[MESSAGES] Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    console.log('[MESSAGES] Fetched messages:', { 
      conversationId, 
      count: messages?.length || 0 
    })

    return NextResponse.json({ 
      messages: messages || [],
      conversationId 
    })

  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
