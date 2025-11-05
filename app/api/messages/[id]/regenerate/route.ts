import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the message and its conversation
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        role,
        content,
        conversations!inner (
          user_id
        )
      `)
      .eq("id", id)
      .eq("conversations.user_id", user.id)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Only allow regenerating assistant messages
    if (message.role !== "assistant") {
      return NextResponse.json({ error: "Can only regenerate assistant messages" }, { status: 400 })
    }

    // Get conversation context (last 10 messages before this one)
    const { data: contextMessages, error: contextError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", message.conversation_id)
      .lt("created_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10)

    if (contextError) {
      console.error("[v0] Error fetching context:", contextError)
      return NextResponse.json({ error: "Failed to fetch context" }, { status: 500 })
    }

    // Call Pelican API for regeneration
    const pelApiKey = process.env.PEL_API_KEY
    if (!pelApiKey) {
      return NextResponse.json({ error: "Pelican API key not configured" }, { status: 500 })
    }

    const pelResponse = await fetch("https://api.pelican.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pelApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: contextMessages.reverse(),
        stream: false,
      }),
    })

    if (!pelResponse.ok) {
      console.error("[v0] Pelican API error:", await pelResponse.text())
      return NextResponse.json({ error: "Failed to regenerate response" }, { status: 500 })
    }

    const pelData = await pelResponse.json()
    const newContent = pelData.choices[0]?.message?.content

    if (!newContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    // Update the message with new content
    const { error: updateError } = await supabase.from("messages").update({ content: newContent }).eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating message:", updateError)
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
    }

    return NextResponse.json({ content: newContent })
  } catch (error) {
    console.error("[v0] Regenerate message API error:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
