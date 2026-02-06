import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  checks: {
    database: {
      status: "ok" | "error"
      latency?: number
      error?: string
    }
    api: {
      status: "ok" | "error"
      configured: boolean
    }
  }
  version?: string
}

export async function GET() {
  const startTime = Date.now()
  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: "ok",
      },
      api: {
        status: "ok",
        configured: !!process.env.PEL_API_KEY,
      },
    },
    version: process.env.npm_package_version || "unknown",
  }

  try {
    const supabase = await createClient()
    const dbStartTime = Date.now()

    const { error } = await supabase.from("conversations").select("id").limit(1).maybeSingle()

    const dbLatency = Date.now() - dbStartTime
    health.checks.database.latency = dbLatency

    if (error) {
      health.checks.database.status = "error"
      health.checks.database.error = error.message
      health.status = "degraded"
    }
  } catch (error) {
    health.checks.database.status = "error"
    health.checks.database.error = error instanceof Error ? error.message : "Unknown error"
    health.status = "unhealthy"
  }

  if (!health.checks.api.configured) {
    health.checks.api.status = "error"
    health.status = "degraded"
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503

  return NextResponse.json(health, {
    status: statusCode,
    headers: { "Cache-Control": "no-cache" },
  })
}