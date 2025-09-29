"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface GuestModeToggleProps {
  onGuestModeChange: (enabled: boolean) => void
}

export function GuestModeToggle({ onGuestModeChange }: GuestModeToggleProps) {
  const [guestMode, setGuestMode] = useState(false)

  const handleToggle = (enabled: boolean) => {
    setGuestMode(enabled)
    onGuestModeChange(enabled)
  }

  return (
    <Card className="w-full max-w-md bg-[var(--surface-2)] border border-white/5">
      <CardHeader>
        <CardTitle className="text-card-foreground">Demo Mode</CardTitle>
        <CardDescription className="text-muted-foreground">Try Pelican AI without creating an account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="guest-mode" checked={guestMode} onCheckedChange={handleToggle} />
          <Label htmlFor="guest-mode" className="text-foreground">
            Enable Guest Mode
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {guestMode
            ? "You're using guest mode. Conversations won't be saved."
            : "Sign in to save your conversations and access full features."}
        </p>
      </CardContent>
    </Card>
  )
}
