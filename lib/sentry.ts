/**
 * Legacy Sentry module - Re-exports from sentry-helper.ts
 * This file is kept for backward compatibility with existing imports
 * New code should import directly from @/lib/sentry-helper
 */

import { captureError as captureErrorHelper, addBreadcrumb as addBreadcrumbHelper } from "./sentry-helper"

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

/**
 * @deprecated Use captureError from @/lib/sentry-helper instead
 */
export function captureException(error: Error, context?: SentryContext) {
  captureErrorHelper(error, {
    userId: context?.userId || context?.guestId,
    ...context,
  })
}

/**
 * @deprecated Use addBreadcrumb from @/lib/sentry-helper instead
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  addBreadcrumbHelper(message, data)
}
