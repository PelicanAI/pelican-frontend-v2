import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface FileRecord {
  id: string
  user_id: string | null
  guest_id: string | null
  conversation_id: string | null
  storage_key: string
  mime: string
  size: number
  checksum: string
  created_at: string
}

export interface CreateFileData {
  user_id?: string | null
  guest_id?: string | null
  conversation_id?: string | null
  storage_key: string
  mime: string
  size: number
  checksum: string
}

/**
 * Find existing file by checksum, mime type, and size
 */
export async function getByChecksum(checksum: string, mime: string, size: number): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("checksum", checksum)
    .eq("mime", mime)
    .eq("size", size)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[files] Error finding by checksum:", error)
    throw new Error("Database error")
  }

  return data || null
}

/**
 * Insert new file record
 */
export async function insertFile(data: CreateFileData): Promise<FileRecord> {
  const { data: file, error } = await supabase.from("files").insert(data).select().single()

  if (error) {
    console.error("[files] Error inserting file:", error)
    throw new Error("Failed to save file record")
  }

  return file
}

/**
 * Mark file as claimed by a conversation
 */
export async function markClaimed(fileId: string, conversationId: string): Promise<void> {
  const { error } = await supabase.from("files").update({ conversation_id: conversationId }).eq("id", fileId)

  if (error) {
    console.error("[files] Error marking file as claimed:", error)
    throw new Error("Failed to claim file")
  }
}

/**
 * Get files by conversation ID
 */
export async function getByConversation(conversationId: string): Promise<FileRecord[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[files] Error getting files by conversation:", error)
    throw new Error("Failed to get conversation files")
  }

  return data || []
}
