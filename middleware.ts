import { updateSession } from "@/lib/supabase/middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/upload") {
    const clientId = getClientIdentifier(request)
    const rateLimitKey = `${clientId}:upload`

    const result = rateLimit(rateLimitKey, 10, 60 * 1000) // 10 requests per minute

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many uploads" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
          },
        },
      )
    }

    // Add rate limit headers to successful requests
    const response = await updateSession(request)
    response.headers.set("X-RateLimit-Limit", result.limit.toString())
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    response.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString())

    return response
  }

  // Existing code for other paths
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
