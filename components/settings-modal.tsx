"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme } = useTheme()
  const [proDark, setProDark] = useState(false)

  // Load Pro Dark setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pelican-pro-dark")
    if (saved === "true") {
      setProDark(true)
      document.body.classList.add("pro-dark")
    }
  }, [])

  // Handle Pro Dark toggle
  const handleProDarkChange = (enabled: boolean) => {
    setProDark(enabled)
    localStorage.setItem("pelican-pro-dark", enabled.toString())

    if (enabled) {
      document.body.classList.add("pro-dark")
    } else {
      document.body.classList.remove("pro-dark")
    }
  }

  const isDarkMode = theme === "dark"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--surface-2)] border border-white/8">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Appearance</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pro-dark" className="text-sm font-medium text-[var(--foreground)]">
                  Pro Dark
                </Label>
                <p className="text-xs text-white/55">Enhanced dark theme with refined contrast and borders</p>
              </div>
              <Switch
                id="pro-dark"
                checked={proDark}
                onCheckedChange={handleProDarkChange}
                disabled={!isDarkMode}
                className="focus-outline"
              />
            </div>

            {!isDarkMode && <p className="text-xs text-white/40">Pro Dark is only available in dark mode</p>}
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--foreground)]">About</h3>
            <p className="text-xs text-white/55">Pelican AI - Your intelligent trading assistant</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
