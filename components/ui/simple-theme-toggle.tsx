"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

interface SimpleThemeToggleProps {
  onThemeChange: (isDark: boolean) => void
}

export function SimpleThemeToggle({ onThemeChange }: SimpleThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved chat theme preference or default to light
    const savedTheme = localStorage.getItem("chatTheme")
    if (savedTheme) {
      const darkMode = savedTheme === "dark"
      setIsDark(darkMode)
      onThemeChange(darkMode) // Notify parent immediately
    } else {
      // Default to light mode on first load
      onThemeChange(false)
    }
  }, [onThemeChange])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem("chatTheme", newIsDark ? "dark" : "light")
    onThemeChange(newIsDark)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`border transition-colors ${
        isDark
          ? "text-primary hover:text-foreground hover:bg-primary/10 border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
      }`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
