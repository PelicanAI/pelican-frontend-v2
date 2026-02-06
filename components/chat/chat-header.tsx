"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, MoreVertical, Zap, Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/animated-theme-toggle"

interface ChatHeaderProps {
  onSettingsClick?: () => void
  onMenuClick?: () => void
  isOnline?: boolean
}

export function ChatHeader({ onSettingsClick, onMenuClick, isOnline = true }: ChatHeaderProps) {
  return (
    <Card className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="relative">
            <Image src="/pelican-logo-transparent.webp" alt="Pelican AI" width={32} height={32} className="rounded-lg" priority />
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div>
            <h1 className="font-semibold text-lg">Pelican AI</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Elite Trading Assistant
              </Badge>
              <span className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={onSettingsClick} className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
