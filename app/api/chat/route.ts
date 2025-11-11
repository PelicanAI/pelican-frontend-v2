import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { streamWithRetry } from "@/lib/api-retry"
import { sanitizeMessage, sanitizeTitle } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"
import { getTradingSessionId } from "@/lib/trading-metadata"
import type { User } from "@supabase/supabase-js"
import * as Sentry from "@sentry/nextjs"

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
      // Capture authentication failures in Sentry
      Sentry.captureException(new AuthenticationError(), {
        tags: { error_location: 'authentication', endpoint: '/api/chat' },
        extra: { authError: authError?.message }
      })
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
      console.log("✅ [CHAT_RESPONSE] Created conversation in DB:", { 
        conversationId: activeConversationId,
        title: newConversation.title,
        userId: effectiveUserId,
        createdAt: newConversation.created_at
      })
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
    
    // ✅ [DEBUG] Log successful response handling
    console.log('[CHAT_RESPONSE] Successfully processed API response', {
      conversationId: activeConversationId,
      replyLength: reply.length,
      hasAttachments: attachments.length > 0,
      timestamp: new Date().toISOString()
    })
    
    // Send to Sentry for visibility
    Sentry.captureMessage('[CHAT_RESPONSE] Successfully processed API response', {
      level: 'info',
      tags: { endpoint: '/api/chat', status: 'success' },
      extra: { conversationId: activeConversationId, replyLength: reply.length, hasAttachments: attachments.length > 0 }
    })

    // 🔧 FIX: Backend already saves messages and creates embeddings
    // Removed duplicate saveMessagesToDatabase() call to prevent constraint violations
    // The backend Pelican service handles:
    // - Message persistence
    // - Memory embedding creation
    // - Conversation metadata updates

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
    
    // ❌ [ERROR] Log errors for debugging
    console.error('[CHAT_RESPONSE] API Error', {
      conversationId: activeConversationId,
      userId: effectiveUserId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    })
    
    // Capture the error in Sentry
    Sentry.captureException(error, {
      tags: { endpoint: '/api/chat', error_location: 'api_handler' },
      extra: { conversationId: activeConversationId, userId: effectiveUserId }
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

// 🔧 REMOVED: saveMessagesToDatabase function
// The backend Pelican service handles all message persistence and embedding creation.
// This function was causing duplicate inserts and constraint violations.
