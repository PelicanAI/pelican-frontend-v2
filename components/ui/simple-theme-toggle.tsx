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
          ? "text-purple-300 hover:text-white hover:bg-purple-800/30 border-purple-700/30"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
      }`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
