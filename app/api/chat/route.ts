import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { streamWithRetry } from "@/lib/api-retry"
import { sanitizeMessage, sanitizeTitle } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"
import { getTradingSessionId } from "@/lib/trading-metadata"
import type { User } from "@supabase/supabase-js"

interface ChatRequest {
  message: string
  conversationId?: string
  stream?: boolean
  temperature?: number
  max_tokens?: number
  fileIds?: string[]
}

interface ChatResponsePayload {
  choices: Array<{
    message: {
      role: string
      content: string | { content: string; attachments: Array<{ type: string; name: string; url: string }> }
    }
    finish_reason: string
  }>
  conversationId: string | null
  timestamp: string
}

export async function POST(req: NextRequest) {
  let user: User | null = null
  let effectiveUserId: string | null = null
  let activeConversationId: string | null = null

  try {
    const signal = req.signal // Extract AbortController signal from request

    const { message, conversationId, fileIds }: ChatRequest = await req.json()

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userMessage = sanitizeMessage(message, LIMITS.CHAT_MAX_TOKENS)

    const supabase = await createClient()

    activeConversationId = conversationId || null

    // Require authentication - no guest mode
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !authUser) {
      throw new AuthenticationError()
    }
    user = authUser
    effectiveUserId = user.id

    if (!activeConversationId && effectiveUserId) {
      const title = sanitizeTitle(userMessage, LIMITS.TITLE_PREVIEW_LENGTH)

      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: effectiveUserId,
          title: title,
        })
        .select()
        .single()

      if (createError) {
        logger.error("Failed to create conversation", createError, { userId: effectiveUserId })
        throw new Error("Failed to create conversation in database")
      }

      activeConversationId = newConversation.id
      logger.info("Created new conversation", { conversationId: activeConversationId, userId: effectiveUserId })
    }

    const apiKey = process.env.PEL_API_KEY
    const apiUrl = process.env.PEL_API_URL

    if (!apiKey) {
      logger.error("PEL_API_KEY not configured")
      throw new ExternalAPIError("Pelican", "API key not configured", "AI service is temporarily unavailable. Please try again later.")
    }

    if (!apiUrl) {
      logger.error("PEL_API_URL not configured")
      throw new ExternalAPIError("Pelican", "API URL not configured", "AI service is temporarily unavailable. Please try again later.")
    }

    const endpoint = `${apiUrl}/api/pelican_response`
    logger.info("Using Pelican API endpoint", { endpoint })

    // Generate trading session ID for memory continuity
    const sessionId = effectiveUserId ? getTradingSessionId(effectiveUserId) : null

    // TODO: Backend will fetch conversation context using conversation_id
    // TODO: Backend will extract and save trading metadata
    // TODO: Backend will update message metadata in Supabase after processing
    
    const requestBody = {
      message: userMessage,
      user_id: effectiveUserId || "anonymous",
      conversation_id: activeConversationId || null,
      session_id: activeConversationId || null,  // Backward compatibility - same as conversation_id
      timestamp: new Date().toISOString(),
      stream: false,  // Streaming disabled
    }
    
    logger.info("Sending request to backend", {
      conversationId: activeConversationId,
      userId: effectiveUserId,
      messageLength: userMessage.length,
    })

    // Disable streaming - always request JSON response
    const response = await streamWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",  // Request JSON, not streaming
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal,
      retryOptions: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Pelican API request failed", new Error(errorText), {
        status: response.status,
        userId: effectiveUserId,
        conversationId: activeConversationId,
      })
      throw new Error(`API request failed with status ${response.status}`)
    }

    // Always return JSON - streaming disabled
    const data = await response.json()
    
    // Handle both old format (plain string) and new format (object with content and attachments)
    let reply: string
    let attachments: Array<{ type: string; name: string; url: string }> = []
    
    if (typeof data.reply === 'object' && data.reply !== null && 'content' in data.reply) {
      // New format with attachments
      reply = data.reply.content || "No response received"
      attachments = data.reply.attachments || []
    } else if (typeof data.reply === 'string') {
      // Old format (plain string)
      reply = data.reply
      attachments = []
    } else {
      // Fallback to other possible fields
      reply = data.text || data.content || "No response received"
      attachments = []
    }

    logger.info("Received JSON response", {
      conversationId: activeConversationId,
      userId: effectiveUserId,
      responseLength: reply.length,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
    })

    // Always save to database for authenticated users (save only the text content, not attachments)
    if (activeConversationId && effectiveUserId) {
      await saveMessagesToDatabase(supabase, activeConversationId, userMessage, reply, effectiveUserId)
    }

    // Return JSON response with attachments if present
    const responsePayload: ChatResponsePayload = {
      choices: [
        {
          message: {
            role: "assistant",
            content: attachments.length > 0 ? { content: reply, attachments } : reply,
          },
          finish_reason: "stop",
        },
      ],
      conversationId: activeConversationId,
      timestamp: data.timestamp || new Date().toISOString(),
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.info("Request aborted by user")
      return new Response(null, { status: 499 })
    }

    const friendlyError = getUserFriendlyError(error)
    logger.error("Chat API error", error instanceof Error ? error : new Error(String(error)), {
      conversationId: activeConversationId,
      userId: effectiveUserId,
    })

    return NextResponse.json(
      {
        error: friendlyError.message,
        code: error instanceof Error && "statusCode" in error ? error.statusCode : friendlyError.statusCode,
      },
      { status: friendlyError.statusCode },
    )
  }
}

async function saveMessagesToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userMessage: string,
  reply: string,
  userId: string,
) {
  // Backend will handle metadata extraction
  const { data: insertData, error: insertError } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: userMessage,
      metadata: {},  // Backend will populate this
    },
    {
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
      metadata: {},  // Backend will populate this
    },
  ]).select()

  if (insertError) {
    logger.error("Failed to save messages to database", insertError, {
      conversationId,
      userId,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    })
  } else {
    logger.info("Messages saved to conversation", { conversationId, userId })

    const { count: messageCount, error: countError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)

    if (countError) {
      logger.error("Failed to count messages", countError, { conversationId })
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        message_count: messageCount || 0,
        last_message_preview: userMessage.slice(0, 100) + (userMessage.length > 100 ? "..." : ""),
      })
      .eq("id", conversationId)
      .eq("user_id", userId)

    if (updateError) {
      logger.error("Failed to update conversation metadata", updateError, {
        code: updateError.code,
        conversationId,
        userId,
      })
    }
  }
}
