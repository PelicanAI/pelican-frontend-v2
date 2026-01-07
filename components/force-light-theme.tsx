"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

/**
 * Force Light Theme Wrapper
 * 
 * Wraps content to force light theme regardless of user preference.
 * Restores previous theme on unmount.
 */
export function ForceLightTheme({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme()
  const previousTheme = useRef<string | undefined>(theme)

  useEffect(() => {
    // Store current theme
    previousTheme.current = theme
    
    // Force light theme
    setTheme('light')
    
    // Restore previous theme on unmount
    return () => {
      if (previousTheme.current) {
        setTheme(previousTheme.current)
      }
    }
  }, [setTheme, theme])

  return <>{children}</>
}

