/**
 * Sentry instrumentation utilities
 * 
 * Helper functions for performance monitoring and error tracking.
 * Only used for critical paths - backend API calls, streaming, and auth.
 */

import * as Sentry from "@sentry/nextjs"

/**
 * Wraps a fetch call with Sentry performance monitoring
 * 
 * @param endpoint - The API endpoint being called (e.g., "/api/chat")
 * @param fetchFn - The fetch function to execute
 * @returns The fetch response
 */
export async function instrumentedFetch<T>(
  endpoint: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      op: "http.client",
      name: `POST ${endpoint}`,
    },
    async () => {
      try {
        return await fetchFn()
      } catch (error) {
        // Re-throw to let caller handle, but mark as error in span
        throw error
      }
    }
  )
}

/**
 * Captures a critical error with context
 * Use only for: backend API failures, streaming errors, auth failures
 * 
 * @param error - The error to capture
 * @param context - Additional context for debugging
 */
export function captureCriticalError(
  error: unknown,
  context: {
    location: "api_call" | "streaming" | "authentication"
    endpoint?: string
    conversationId?: string | null
    userId?: string
    messageLength?: number
  }
) {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  Sentry.captureException(errorObj, {
    tags: {
      error_location: context.location,
      endpoint: context.endpoint,
    },
    extra: {
      conversationId: context.conversationId,
      userId: context.userId,
      messageLength: context.messageLength,
    },
  })
}

