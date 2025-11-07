import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { conversationId, messageId, content, role, isPartial } = await request.json()

    if (!conversationId || !messageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Save partial message
    const { error } = await supabase
      .from('messages')
      .upsert({
        id: messageId,
        conversation_id: conversationId,
        role: role,
        content: content,
        is_partial: isPartial || true,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('Error saving partial message:', error)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in save-partial:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

