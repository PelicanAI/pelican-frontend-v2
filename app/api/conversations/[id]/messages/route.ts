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

    // First verify the conversation belongs to this user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      console.log('[API] Conversation not found or access denied:', { 
        conversationId, 
        userId: user.id,
        error: convError?.message 
      })
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('[API] Error fetching messages:', msgError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    console.log('[API] Fetched messages:', { 
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

