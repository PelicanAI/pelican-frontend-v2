// In-memory rate limiting (fallback when Redis is not available)
// Note: This won't work across multiple server instances in production
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export function rateLimit(
  key: string,
  limit = 10,
  windowMs: number = 60 * 1000, // 1 minute
): RateLimitResult {
  const now = Date.now()
  const resetTime = now + windowMs

  const existing = rateLimitStore.get(key)

  if (!existing || now > existing.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime,
    }
  }

  if (existing.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  // Increment count
  existing.count++
  rateLimitStore.set(key, existing)

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetTime: existing.resetTime,
  }
}

export function getClientIdentifier(request: Request): string {
  // Try to get user ID from headers (set by auth middleware)
  const userId = request.headers.get("x-user-id")
  if (userId) {
    return `user:${userId}`
  }

  // Fallback to IP address for guests
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? "unknown" : "unknown"
  return `guest:${ip}`
}
