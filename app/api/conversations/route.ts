import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "active" // active|archived|all
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const cursor = searchParams.get("cursor")

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let query = supabase
      .from("conversations")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        message_count,
        last_message_preview,
        archived,
        archived_at,
        deleted_at
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null) // Never show deleted conversations

    if (filter === "active") {
      query = query.is("archived_at", null)
    } else if (filter === "archived") {
      query = query.not("archived_at", "is", null)
    }
    // filter === "all" shows both active and archived

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,last_message_preview.ilike.%${search}%`)
    }

    if (cursor) {
      query = query.lt("updated_at", cursor)
    }

    const { data: conversations, error } = await query.order("updated_at", { ascending: false }).limit(limit)

    if (error) {
      console.error("[v0] Error fetching conversations:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    const nextCursor = conversations.length === limit ? conversations[conversations.length - 1]?.updated_at : null

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        archivedAt: conv.archived_at,
        updatedAt: conv.updated_at,
        messageCount: conv.message_count || 0,
        preview: conv.last_message_preview,
      })),
      nextCursor,
      hasMore: conversations.length === limit,
    })
  } catch (error) {
    console.error("[v0] Conversations API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch conversations",
        code: "fetch_failed",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title = "New Conversation" } = await req.json()
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating conversation:", error)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    console.log("[v0] Created new conversation:", conversation.id)
    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Create conversation API error:", error)
    return NextResponse.json(
      {
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
