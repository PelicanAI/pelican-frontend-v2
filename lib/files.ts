/**
 * File Management Utilities
 * 
 * Server-side file record management for Next.js API routes.
 * Uses service role key for server-to-server operations.
 * 
 * @version 2.0.0 - UUID Migration Compatible
 */

import { createClient } from "@supabase/supabase-js"

// Service role client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// UUID Validation
// ============================================================================

function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Find existing file by checksum, mime type, and size.
 * Used for deduplication - if file already exists, return it instead of uploading again.
 */
export async function getByChecksum(
  checksum: string,
  mime: string,
  size: number
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("checksum", checksum)
    .eq("mime", mime)
    .eq("size", size)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[files] Error finding by checksum:", error)
    throw new Error("Database error while searching for file")
  }

  return data || null
}

/**
 * Insert new file record.
 * Uses .select().single() to return the created record and verify success.
 */
export async function insertFile(data: CreateFileData): Promise<FileRecord> {
  if (data.user_id && !isValidUUID(data.user_id)) {
    console.error("[files] Invalid user_id format:", data.user_id)
    throw new Error("Invalid user_id: must be a valid UUID")
  }

  const { data: file, error } = await supabase
    .from("files")
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error("[files] Error inserting file:", error)
    throw new Error("Failed to save file record")
  }

  if (!file) {
    console.error("[files] Insert returned no data")
    throw new Error("Failed to save file record: no data returned")
  }

  return file
}

/**
 * Mark file as claimed by a conversation.
 * Uses .select().single() to verify the update succeeded.
 */
export async function markClaimed(fileId: string, conversationId: string): Promise<void> {
  const { data, error } = await supabase
    .from("files")
    .update({ conversation_id: conversationId })
    .eq("id", fileId)
    .select()
    .single()

  if (error) {
    console.error("[files] Error marking file as claimed:", error)
    throw new Error("Failed to claim file")
  }

  if (!data) {
    console.error("[files] markClaimed returned no data - file may not exist or RLS rejected")
    throw new Error("Failed to claim file: file not found or permission denied")
  }
}

/**
 * Get files by conversation ID.
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

/**
 * Get files by user ID.
 */
export async function getByUserId(userId: string): Promise<FileRecord[]> {
  if (!isValidUUID(userId)) {
    console.error("[files] Invalid user_id format:", userId)
    throw new Error("Invalid user_id: must be a valid UUID")
  }

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[files] Error getting files by user:", error)
    throw new Error("Failed to get user files")
  }

  return data || []
}

/**
 * Delete a file record by ID.
 * Uses .select() to verify the delete succeeded.
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId)
    .select()

  if (error) {
    console.error("[files] Error deleting file:", error)
    throw new Error("Failed to delete file")
  }

  if (!data || data.length === 0) {
    console.warn("[files] Delete returned no data - file may not exist")
    return false
  }

  return true
}

/**
 * Delete all files for a user.
 * Used during account deletion.
 */
export async function deleteUserFiles(userId: string): Promise<number> {
  if (!isValidUUID(userId)) {
    console.error("[files] Invalid user_id format:", userId)
    throw new Error("Invalid user_id: must be a valid UUID")
  }

  const { data, error } = await supabase
    .from("files")
    .delete()
    .eq("user_id", userId)
    .select()

  if (error) {
    console.error("[files] Error deleting user files:", error)
    throw new Error("Failed to delete user files")
  }

  return data?.length || 0
}
