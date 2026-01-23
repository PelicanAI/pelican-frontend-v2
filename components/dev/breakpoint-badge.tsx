"use client"

import { useEffect, useState } from "react"

const BREAKPOINTS = [
  { name: "xs", min: 0 },
  { name: "sm", min: 640 },
  { name: "md", min: 768 },
  { name: "lg", min: 1024 },
  { name: "xl", min: 1280 },
  { name: "2xl", min: 1536 },
  { name: "3xl", min: 1920 },
  { name: "4xl", min: 2560 },
]

function getBreakpoint(width: number) {
  let current = BREAKPOINTS[0]?.name ?? "xs"
  for (const bp of BREAKPOINTS) {
    if (width >= bp.min) {
      current = bp.name
    }
  }
  return current
}

export function BreakpointBadge() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  if (!viewport.width || !viewport.height) {
    return null
  }

  const label = getBreakpoint(viewport.width)

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] pointer-events-none rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur"
      aria-hidden="true"
    >
      {label} · {viewport.width}×{viewport.height}
    </div>
  )
}

