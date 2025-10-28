"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  onThemeChange: (isDark: boolean) => void
}

export function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved chat theme preference or default to light
    const savedTheme = localStorage.getItem("chatTheme")
    if (savedTheme) {
      const darkMode = savedTheme === "dark"
      setIsDark(darkMode)
      onThemeChange(darkMode) // Immediately notify parent
    } else {
      // Default to light mode on first load
      onThemeChange(false) // Set parent to light mode
    }
  }, [onThemeChange])

  const toggleTheme = () => {
    const newIsDark = !isDark // Flip state
    setIsDark(newIsDark) // Update local state
    localStorage.setItem("chatTheme", newIsDark ? "dark" : "light") // Persist
    onThemeChange(newIsDark) // Notify parent
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`h-8 w-8 border transition-colors ${
        isDark
          ? "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
      }`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" /> // Show sun icon in dark mode (click to go light)
      ) : (
        <Moon className="h-4 w-4" /> // Show moon icon in light mode (click to go dark)
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
