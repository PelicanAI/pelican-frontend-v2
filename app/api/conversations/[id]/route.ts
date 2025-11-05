import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get specific conversation with messages
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Error fetching conversation:", error)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Conversation API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { title, archived } = await req.json()
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const updateData: {
      title?: string
      archived?: boolean
      archived_at?: string | null
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (archived !== undefined) {
      updateData.archived = archived
      updateData.archived_at = archived ? new Date().toISOString() : null
    }

    // Update conversation
    const { error } = await supabase
      .from("conversations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null) // Ensure we don't update deleted conversations

    if (error) {
      console.error("[v0] Error updating conversation:", error)
      return NextResponse.json(
        {
          error: "Failed to update conversation",
          code: "update_failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update conversation API error:", error)
    return NextResponse.json(
      {
        error: "Failed to update conversation",
        code: "update_failed",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { error } = await supabase
      .from("conversations")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null) // Only delete non-deleted conversations

    if (error) {
      console.error("[v0] Error deleting conversation:", error)
      return NextResponse.json(
        {
          error: "Failed to delete conversation",
          code: "delete_failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete conversation API error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete conversation",
        code: "delete_failed",
      },
      { status: 500 },
    )
  }
}
