import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { streamWithRetry } from "@/lib/api-retry"
import { sanitizeMessage, sanitizeTitle } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ValidationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"
import { getTradingSessionId } from "@/lib/trading-metadata"

interface ChatRequest {
  message: string
  conversationId?: string
  stream?: boolean
  temperature?: number
  max_tokens?: number
  guestMode?: boolean
  guestUserId?: string
  fileIds?: string[]
}

function generateGuestUUID(): string {
  // Generate a valid UUID v4 for guest users
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function POST(req: NextRequest) {
  let user: any = null
  let effectiveUserId: string | null = null
  let activeConversationId: string | null = null
  
  try {
    const signal = req.signal // Extract AbortController signal from request

    const { message, conversationId, guestMode, guestUserId, fileIds }: ChatRequest = await req.json()

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userMessage = sanitizeMessage(message, LIMITS.CHAT_MAX_TOKENS)

    const supabase = await createClient()

    activeConversationId = conversationId || null

    if (!guestMode) {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !authUser) {
        throw new AuthenticationError()
      }
      user = authUser
      effectiveUserId = user.id
    } else {
      effectiveUserId = guestUserId || generateGuestUUID()
      logger.info("Guest mode active", { userId: effectiveUserId })
    }

    if (!activeConversationId && effectiveUserId && !guestMode) {
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
        // Fallback to temporary ID if database creation fails
        activeConversationId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } else {
        activeConversationId = newConversation.id
        logger.info("Created new conversation", { conversationId: activeConversationId, userId: effectiveUserId })
      }
    } else if (!activeConversationId && guestMode) {
      activeConversationId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      logger.info("Created guest conversation", { conversationId: activeConversationId })
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
      timestamp: new Date().toISOString(),
      stream: true,
    }
    
    logger.info("Sending request to backend", {
      conversationId: activeConversationId,
      userId: effectiveUserId,
      messageLength: userMessage.length,
    })

    const response = await streamWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("text/stream") || contentType?.includes("text/event-stream")) {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      let fullResponse = ""

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

              const chunk = decoder.decode(value, { stream: true })
              fullResponse += chunk

              const data = JSON.stringify({
                choices: [
                  {
                    delta: { content: chunk },
                    finish_reason: null,
                  },
                ],
                conversationId: activeConversationId,
                timestamp: new Date().toISOString(),
              })

              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            if (!signal?.aborted) {
              const finalData = JSON.stringify({
                choices: [
                  {
                    message: { role: "assistant", content: fullResponse },
                    finish_reason: "stop",
                  },
                ],
                conversationId: activeConversationId,
                timestamp: new Date().toISOString(),
              })

              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`))

              if (
                activeConversationId &&
                effectiveUserId &&
                !guestMode &&
                !activeConversationId.startsWith("temp-") &&
                !activeConversationId.startsWith("guest-")
              ) {
                await saveMessagesToDatabase(supabase, activeConversationId, userMessage, fullResponse, effectiveUserId)
              } else {
                logger.info("Guest/temporary conversation - not saved to database", { conversationId: activeConversationId })
              }
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
      const data = await response.json()
      logger.info("Received non-streaming response", {
        conversationId: activeConversationId,
        userId: effectiveUserId,
        responseLength: (data.text || data.reply || "").length,
      })

      const reply = data.text || data.reply || "No response received"

      if (
        activeConversationId &&
        effectiveUserId &&
        !guestMode &&
        !activeConversationId.startsWith("temp-") &&
        !activeConversationId.startsWith("guest-")
      ) {
        await saveMessagesToDatabase(supabase, activeConversationId, userMessage, reply, effectiveUserId)
      } else {
        logger.info("Guest/temporary conversation - not saved to database", { conversationId: activeConversationId })
      }

      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: reply,
            },
            finish_reason: "stop",
          },
        ],
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
  supabase: any,
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
