import { updateSession } from "@/lib/supabase/middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { countryToLocale, type Locale } from '@/lib/languages'

async function getLocale(req: NextRequest): Promise<string> {
  // 1. Check cookie
  const cookieLocale = req.cookies.get('locale')?.value;
  if (cookieLocale) {
    return cookieLocale;
  }

  // 2. IP-based detection
  const locale = await detectLocaleFromIP(req);
  if (locale) {
    return locale;
  }

  // 3. Browser language
  const acceptLanguage = req.headers.get('accept-language');
  if (acceptLanguage) {
    const firstLang = acceptLanguage.split(',')[0];
    if (firstLang) {
      const browserLocale = firstLang.split('-')[0].toLowerCase();
      const supportedLocales = ['en', 'zh', 'es', 'fr', 'ar', 'pt', 'ru', 'ja', 'de', 'ko', 'it', 'tr', 'nl', 'pl', 'sv', 'id', 'uk', 'he', 'el', 'cs', 'ro', 'hu', 'da', 'fi', 'no', 'sk', 'vi', 'th', 'ms'];
      if (supportedLocales.includes(browserLocale)) {
        return browserLocale;
      }
    }
  }

  return 'en';
}

async function detectLocaleFromIP(req: NextRequest): Promise<string | null> {
  try {
    // Try Cloudflare headers first
    const cfCountry = req.headers.get('cf-ipcountry');
    if (cfCountry && countryToLocale[cfCountry]) {
      return countryToLocale[cfCountry];
    }

    // Fallback to IP geolocation API
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') ||
               req.ip;
    
    if (ip && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
      const response = await fetch(`https://ipapi.co/${ip}/country_code/`, {
        signal: AbortSignal.timeout(1000)
      });
      
      if (response.ok) {
        const country = await response.text();
        return countryToLocale[country.trim()] || null;
      }
    }
  } catch (error) {
    console.error('IP detection failed:', error);
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  // Skip API routes for locale detection, but still apply rate limiting
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // Rate limit chat endpoint - critical for scalability
  if (request.nextUrl.pathname === "/api/chat") {
    const clientId = getClientIdentifier(request)
    const rateLimitKey = `${clientId}:chat`

    // 30 requests per minute to handle high concurrency while preventing abuse
    const result = rateLimit(rateLimitKey, 30, 60 * 1000)

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const apiResponse = await updateSession(request)
    apiResponse.headers.set("X-RateLimit-Limit", result.limit.toString())
    apiResponse.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    apiResponse.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString())

    return apiResponse
  }

  // Rate limit upload endpoint
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
    const apiResponse = await updateSession(request)
    apiResponse.headers.set("X-RateLimit-Limit", result.limit.toString())
    apiResponse.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    apiResponse.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString())

    return apiResponse
  }

  // For non-API routes, update session and add locale detection
  if (!isApiRoute) {
    const sessionResponse = await updateSession(request)
    let locale = await getLocale(request);
    
    // Set locale cookie if not already set
    if (!request.cookies.get('locale')) {
      sessionResponse.cookies.set('locale', locale, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        path: '/'
      });
    }

    // Add locale to headers for server components
    sessionResponse.headers.set('x-locale', locale);
    return sessionResponse;
  }

  // Existing code for other API paths
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
