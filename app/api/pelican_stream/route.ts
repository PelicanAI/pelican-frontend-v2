import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { streamWithRetry } from "@/lib/api-retry"
import { sanitizeMessage } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"
import { getTradingSessionId } from "@/lib/trading-metadata"
import type { User } from "@supabase/supabase-js"

interface PelicanStreamRequest {
  message: string
  conversationId?: string
  fileIds?: string[]
}

export async function POST(req: NextRequest) {
  let user: User | null = null
  let effectiveUserId: string | null = null
  let activeConversationId: string | null = null

  try {
    const signal = req.signal

    const { message, conversationId }: PelicanStreamRequest = await req.json()

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
      throw new AuthenticationError()
    }
    user = authUser
    effectiveUserId = user.id

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

    // Use the pelican_stream endpoint
    const endpoint = `${apiUrl}/api/pelican_stream`
    logger.info("Using Pelican stream API endpoint", { endpoint })

    // Generate trading session ID for memory continuity
    const sessionId = effectiveUserId ? getTradingSessionId(effectiveUserId) : null

    const requestBody = {
      message: userMessage,
      user_id: effectiveUserId || "anonymous",
      conversation_id: activeConversationId || null,
      session_id: activeConversationId || null,
      timestamp: new Date().toISOString(),
    }

    logger.info("Sending stream request to Pelican backend", {
      conversationId: activeConversationId,
      userId: effectiveUserId,
      messageLength: userMessage.length,
    })

    // Check if client requested streaming (always expect streaming for this endpoint)
    const acceptHeader = req.headers.get("accept") || "text/event-stream"
    
    const response = await streamWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": acceptHeader,  // Forward Accept header to backend
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
      logger.error("Pelican stream API request failed", new Error(errorText), {
        status: response.status,
        userId: effectiveUserId,
        conversationId: activeConversationId,
      })
      throw new Error(`API request failed with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("text/stream") || contentType?.includes("text/event-stream")) {
      // Stream the response directly to the client with minimal transformation
      // The backend should already be sending data in the format: data: {content: "..."}\n
      const decoder = new TextDecoder()
      let fullResponseContent = ""
      let buffer = ""

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          try {
            while (true) {
              if (signal?.aborted) {
                logger.info("Request aborted, stopping stream", { conversationId: activeConversationId })
                reader.cancel()
                controller.close()
                return
              }

              const { done, value } = await reader.read()
              if (done) break

              // Debug: Log what backend is sending
              const chunkText = decoder.decode(value, { stream: true })
              logger.info("Backend chunk received", { 
                chunkLength: chunkText.length,
                chunkPreview: chunkText.slice(0, 100),
                hasDataPrefix: chunkText.includes("data: ")
              })
              console.log('Backend raw chunk:', chunkText.slice(0, 200))

              // Forward chunks directly - backend handles the formatting
              controller.enqueue(value)

              // Parse chunks to extract content for database saving
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop() || ""

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    continue
                  }

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) {
                      fullResponseContent += parsed.content
                    }
                  } catch (parseError) {
                    // Ignore parse errors for individual chunks
                  }
                }
              }
            }

            // Process remaining buffer
            if (buffer) {
              const lines = buffer.split("\n")
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    continue
                  }

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) {
                      fullResponseContent += parsed.content
                    }
                  } catch (parseError) {
                    // Ignore parse errors
                  }
                }
              }
            }

            // Save messages to database after stream completes
            if (!signal?.aborted && activeConversationId && effectiveUserId && fullResponseContent.trim()) {
              await saveMessagesToDatabase(supabase, activeConversationId, userMessage, fullResponseContent.trim(), effectiveUserId)
            }
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              logger.info("Stream aborted by user", { conversationId: activeConversationId })
              controller.close()
              return
            }
            logger.error("Streaming error occurred", error instanceof Error ? error : new Error(String(error)), {
              conversationId: activeConversationId,
              userId: effectiveUserId,
            })
            controller.error(error)
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // Non-streaming response fallback
      const data = await response.json()
      logger.info("Received non-streaming response", {
        conversationId: activeConversationId,
        userId: effectiveUserId,
      })

      return NextResponse.json({
        content: data.text || data.reply || data.content || "No response received",
        conversationId: activeConversationId,
        timestamp: data.timestamp || new Date().toISOString(),
      })
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.info("Request aborted by user")
      return new Response(null, { status: 499 })
    }

    const friendlyError = getUserFriendlyError(error)
    logger.error("Pelican stream API error", error instanceof Error ? error : new Error(String(error)), {
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
      metadata: {}, // Backend will populate this
    },
    {
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
      metadata: {}, // Backend will populate this
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

