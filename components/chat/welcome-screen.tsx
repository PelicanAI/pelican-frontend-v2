"use client"

import { useT } from "@/lib/providers/translation-provider"

interface WelcomeScreenProps {
  onQuickStart: (message: string) => void
  onSettingsClick?: () => void
}

export function WelcomeScreen({ onQuickStart }: WelcomeScreenProps) {
  const t = useT()

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background min-h-[600px]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [background:radial-gradient(600px_400px_at_50%_10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)] [@media(prefers-reduced-transparency:reduce)]:hidden"
        style={{ contentVisibility: 'auto' }}
      />

      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex justify-center h-32">
          <img 
            src="/pelican-logo.png" 
            alt={t.common.appName} 
            className="w-32 h-32 object-contain" 
            width="128"
            height="128"
          />
        </div>

        <h1 className="text-4xl font-semibold text-balance text-foreground tracking-tight h-auto">
          {t.chat.welcomeTitle}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t.chat.welcomeSubtitle}
        </p>
      </div>
    </div>
  )
}
