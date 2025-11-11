import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { sanitizeMessage, sanitizeTitle } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"
import type { User } from "@supabase/supabase-js"
import * as Sentry from "@sentry/nextjs"

interface StreamingRequest {
  message: string
  conversationId?: string | null
  conversationHistory?: Array<{ role: string; content: string }>
  fileIds?: string[]
}

export async function POST(req: NextRequest) {
  let user: User | null = null
  let effectiveUserId: string | null = null
  let activeConversationId: string | null = null
  let isNewConversation = false // Track if we created a new conversation

  try {
    const signal = req.signal

    const { 
      message, 
      conversationId, 
      conversationHistory = [],
      fileIds = []
    }: StreamingRequest = await req.json()
    
    logger.info("Received streaming request", {
      messageLength: message?.length || 0,
      conversationId,
      historyLength: conversationHistory.length,
    })

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userMessage = sanitizeMessage(message, LIMITS.CHAT_MAX_TOKENS)

    const supabase = await createClient()

    activeConversationId = conversationId || null

    // Require authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !authUser) {
      // Capture authentication failures in Sentry
      Sentry.captureException(new AuthenticationError(), {
        tags: { error_location: 'authentication', endpoint: '/api/pelican_stream' },
        extra: { authError: authError?.message }
      })
      throw new AuthenticationError()
    }
    user = authUser
    effectiveUserId = user.id

    // Create conversation if needed
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
      isNewConversation = true
      logger.info("Created new conversation", { conversationId: activeConversationId, userId: effectiveUserId })

      // DON'T send conversationId event yet - wait until messages are saved successfully
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

    // Call backend streaming endpoint
    const endpoint = `${apiUrl}/api/pelican_stream`
    logger.info("Calling Pelican streaming API", { endpoint, conversationId: activeConversationId })

    const requestBody = {
      message: userMessage,
      user_id: effectiveUserId || "anonymous",
      conversation_id: activeConversationId || null,
      session_id: activeConversationId || null,
      timestamp: new Date().toISOString(),
      stream: true,  // Enable streaming
      conversationHistory: conversationHistory,
      conversation_history: conversationHistory,  // Backend might expect both formats
      files: fileIds || [], // Forward file IDs to backend
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Pelican streaming API request failed", new Error(errorText), {
        status: response.status,
        userId: effectiveUserId,
        conversationId: activeConversationId,
      })
      throw new Error(`API request failed with status ${response.status}`)
    }

    // Create a TransformStream to handle the SSE stream
    const encoder = new TextEncoder()
    let fullResponse = ""
    
    const stream = new ReadableStream({
      async start(controller) {
        // DON'T send conversationId event yet - will send after successful message save

        const reader = response.body?.getReader()
        if (!reader) {
          controller.error(new Error("No response body"))
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6)
                  const event = JSON.parse(jsonStr)
                  
                  // Forward the event to the client
                  controller.enqueue(encoder.encode(`${line}\n\n`))

                  // Capture content for logging/monitoring only
                  if (event.type === 'content' && event.delta) {
                    fullResponse += event.delta
                  } else if (event.type === 'done' && event.full_response) {
                    fullResponse = event.full_response
                  }

                  // 🔧 FIX: Backend already handles message persistence and embedding creation
                  // Removed duplicate saveMessagesToDatabase() to prevent constraint violations
                  // The backend Pelican service automatically:
                  // - Saves messages to database
                  // - Creates memory embeddings
                  // - Updates conversation metadata
                  // - Handles transaction rollback on failure
                  
                  // Send conversationId event when stream completes (for new conversations)
                  if (event.type === 'done' && isNewConversation && activeConversationId) {
                    const conversationIdEvent = `data: ${JSON.stringify({ 
                      type: 'conversationId', 
                      conversationId: activeConversationId 
                    })}\n\n`
                    controller.enqueue(encoder.encode(conversationIdEvent))
                    logger.info("Sent conversationId event", { conversationId: activeConversationId })
                  }
                } catch (e) {
                  logger.error("Failed to parse SSE event", e instanceof Error ? e : new Error(String(e)), { line })
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            logger.info("Stream aborted by client")
          } else {
            logger.error("Stream error", error instanceof Error ? error : new Error(String(error)))
            const errorEvent = `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`
            controller.enqueue(encoder.encode(errorEvent))
          }
        } finally {
          controller.close()
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable Nginx buffering
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.info("Request aborted by user")
      return new Response(null, { status: 499 })
    }

    const friendlyError = getUserFriendlyError(error)
    logger.error("Pelican streaming API error", error instanceof Error ? error : new Error(String(error)), {
      conversationId: activeConversationId,
      userId: effectiveUserId,
    })

    // Return SSE error event
    const errorEvent = `data: ${JSON.stringify({ 
      type: 'error', 
      message: friendlyError.message 
    })}\n\n`
    
    return new Response(errorEvent, {
      status: 200, // Keep 200 for SSE
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    })
  }
}

// 🔧 REMOVED: saveMessagesToDatabase function
// The backend Pelican service handles all message persistence and embedding creation.
// This function was causing duplicate inserts and constraint violations.