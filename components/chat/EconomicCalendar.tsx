"use client"

import { memo, useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EconomicCalendarProps {
  onClose: () => void
}

function EconomicCalendarInner({ onClose }: EconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ""
    setIsLoading(true)

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetInner = document.createElement("div")
    widgetInner.className = "tradingview-widget-container__widget"
    widgetInner.style.height = "100%"
    widgetInner.style.width = "100%"
    widgetContainer.appendChild(widgetInner)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: false,
      width: "100%",
      height: "100%",
      importanceFilter: "-1,0,1",
      countryFilter: "us",
    })

    widgetContainer.appendChild(script)
    container.appendChild(widgetContainer)

    const timer = setTimeout(() => setIsLoading(false), 1500)

    return () => {
      clearTimeout(timer)
      if (container) {
        container.innerHTML = ""
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-bold text-foreground">Economic Calendar</span>
      </div>

      <div className="flex-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="h-48 w-full mx-4 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full bg-[#131722]" />
      </div>
    </div>
  )
}

export const EconomicCalendar = memo(EconomicCalendarInner)
