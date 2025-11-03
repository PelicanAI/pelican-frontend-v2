// Sentry integration structure (requires @sentry/nextjs package)
// This is a placeholder structure - actual Sentry integration would need proper setup

interface SentryContext {
  reqId?: string
  userId?: string
  guestId?: string
  fileMeta?: {
    name: string
    type: string
    size: number
    checksum?: string
  }
}

export function captureException(error: Error, context?: SentryContext) {
  // In a real implementation, this would use Sentry.captureException
  console.error("[Sentry] Error captured:", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
  })

  // TODO: Replace with actual Sentry integration
  // Sentry.captureException(error, {
  //   tags: {
  //     reqId: context?.reqId,
  //     userId: context?.userId,
  //     guestId: context?.guestId
  //   },
  //   extra: {
  //     fileMeta: context?.fileMeta
  //   }
  // })
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  console.log("[Sentry] Breadcrumb:", message, data)

  // TODO: Replace with actual Sentry integration
  // Sentry.addBreadcrumb({
  //   message,
  //   data,
  //   timestamp: Date.now() / 1000
  // })
}
