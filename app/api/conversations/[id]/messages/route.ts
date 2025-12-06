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

    // Look up memory_conversations by session_id to get the internal id
    const { data: conversation, error: convError } = await supabase
      .from('memory_conversations')
      .select('id, user_id, session_id')
      .eq('session_id', conversationId)
      .eq('user_id', user.id)
      .single()

    // ✅ FIX: New conversations exist in `conversations` but not in `memory_conversations`
    // until the first message is saved by the backend. Return empty array, not 404.
    if (convError || !conversation) {
      console.log('[API] No messages found (new conversation):', { 
        conversationId, 
        userId: user.id,
        error: convError?.message 
      })
      return NextResponse.json({
        messages: [],
        conversationId
      })
    }

    // Fetch messages using memory_conversations.id
    const { data: messages, error: msgError } = await supabase
      .from('memory_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)  // Use the internal id, not session_id
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('[API] Error fetching messages:', msgError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    console.log('[API] Fetched messages:', { 
      conversationId, 
      internalId: conversation.id,
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
