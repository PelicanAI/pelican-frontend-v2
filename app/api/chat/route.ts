import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LIMITS } from "@/lib/constants"
import { streamWithRetry } from "@/lib/api-retry"
import { sanitizeMessage, sanitizeTitle } from "@/lib/sanitize"
import { logger } from "@/lib/logger"
import { AuthenticationError, ValidationError, ExternalAPIError, getUserFriendlyError } from "@/lib/errors"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: Message[]
  conversationId?: string
  stream?: boolean
  temperature?: number
  max_tokens?: number
  guestMode?: boolean
  guestUserId?: string
  isFirstMessage?: boolean
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
  try {
    const signal = req.signal // Extract AbortController signal from request

    const { messages, conversationId, guestMode, guestUserId, isFirstMessage }: ChatRequest = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("Messages array is required and must not be empty", "Please provide a message to send.")
    }

    const sanitizedMessages = messages.map((msg) => ({
      ...msg,
      content: sanitizeMessage(msg.content, LIMITS.CHAT_MAX_TOKENS),
    }))

    const supabase = await createClient()

    let user = null
    let effectiveUserId = null
    let activeConversationId = conversationId

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
      console.log("[v0] Guest mode with user ID:", effectiveUserId)
    }

    if (!activeConversationId && isFirstMessage && effectiveUserId && !guestMode) {
      const userMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || ""
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
        console.error("[v0] Failed to create conversation:", createError)
        // Fallback to temporary ID if database creation fails
        activeConversationId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } else {
        activeConversationId = newConversation.id
        console.log("[v0] Created new conversation:", activeConversationId)
      }
    } else if (!activeConversationId && guestMode) {
      activeConversationId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log("[v0] Created guest conversation:", activeConversationId)
    }

    const apiKey = process.env.PEL_API_KEY
    if (!apiKey) {
      logger.error("PEL_API_KEY not configured")
      throw new ExternalAPIError("Pelican", "API key not configured", "AI service is temporarily unavailable. Please try again later.")
    }

    const endpoint = "https://pelican-api.fly.dev/api/pelican_response"

    const userMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || ""

    if (!userMessage || userMessage.length === 0) {
      throw new ValidationError("Message content is empty after sanitization", "Your message appears to be empty. Please enter a message.")
    }

    let conversationContext: Message[] = []

    if (
      activeConversationId &&
      effectiveUserId &&
      !guestMode &&
      !activeConversationId.startsWith("temp-") &&
      !activeConversationId.startsWith("guest-")
    ) {
      const { data: conversation } = await supabase
        .from("conversations")
        .select(`
          messages (
            role,
            content,
            created_at
          )
        `)
        .eq("id", activeConversationId)
        .eq("user_id", effectiveUserId)
        .single()

      if (conversation?.messages) {
        conversationContext = conversation.messages
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-LIMITS.MESSAGE_CONTEXT)
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
      }
    }

    const requestBody = {
      message: userMessage,
      user_id: effectiveUserId || "anonymous",
      conversation_id: activeConversationId || null,
      conversation_context: conversationContext,
      timestamp: new Date().toISOString(),
      stream: true,
    }

    console.log(`[v0] Calling Pelican API for user ${effectiveUserId || "anonymous"} with message:`, userMessage)
    console.log(`[v0] Conversation context length:`, conversationContext.length)
    console.log(`[v0] Active conversation ID:`, activeConversationId)

    const response = await streamWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
      console.log(`[v0] Pelican API failed with status:`, response.status)
      const errorText = await response.text()
      console.log(`[v0] Error response:`, errorText)
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
                console.log("[v0] Request aborted, stopping stream")
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
                console.log("[v0] Guest/temporary conversation - not saved to database")
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              console.log("[v0] Stream aborted by user")
              controller.close()
              return
            }
            console.error("[v0] Streaming error:", error)
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
      console.log(`[v0] Received response:`, data)

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
        console.log("[v0] Guest/temporary conversation - not saved to database")
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
  const { error: insertError } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: userMessage,
    },
    {
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
    },
  ])

  if (insertError) {
    console.error("[v0] Failed to save messages:", insertError)
    console.error("[v0] Insert error details:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    })
  } else {
    console.log("[v0] Messages saved to conversation:", conversationId)

    const { count: messageCount, error: countError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)

    if (countError) {
      console.error("[v0] Failed to count messages:", countError)
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
      console.error("[v0] Failed to update conversation metadata:", updateError)
      console.error("[v0] Update error details:", {
        code: updateError.code,
        message: updateError.message,
        conversationId,
        userId,
      })
    }
  }
}
