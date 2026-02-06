"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"

interface ChartContextValue {
  mode: "overview" | "chart"
  selectedTicker: string | null
  showChart: (ticker: string) => void
  closeChart: () => void
}

const ChartContext = createContext<ChartContextValue | null>(null)

export function ChartProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"overview" | "chart">("overview")
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  const showChart = useCallback((ticker: string) => {
    setSelectedTicker(ticker.toUpperCase())
    setMode("chart")
  }, [])

  const closeChart = useCallback(() => {
    setMode("overview")
    setSelectedTicker(null)
  }, [])

  return (
    <ChartContext.Provider value={{ mode, selectedTicker, showChart, closeChart }}>
      {children}
    </ChartContext.Provider>
  )
}

const NOOP = () => {}
const DEFAULT_CHART_CONTEXT: ChartContextValue = {
  mode: "overview",
  selectedTicker: null,
  showChart: NOOP,
  closeChart: NOOP,
}

/**
 * Returns chart context. Safe to call outside ChartProvider — returns no-op defaults.
 */
export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext)
  return ctx ?? DEFAULT_CHART_CONTEXT
}
