"use client"

import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface WelcomeScreenProps {
  onQuickStart: (message: string) => void
  onSettingsClick?: () => void
}

export function WelcomeScreen({ onQuickStart }: WelcomeScreenProps) {
  const suggestions = [
    {
      title: "Analyze a stock",
      subtitle: '"What\'s your take on NVDA?"',
    },
    {
      title: "Trading strategy",
      subtitle: '"Help me with risk management"',
    },
    {
      title: "Market overview",
      subtitle: '"What\'s moving the market?"',
    },
    {
      title: "Options play",
      subtitle: '"Find me a bullish strategy"',
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [background:radial-gradient(600px_400px_at_50%_10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)] [@media(prefers-reduced-transparency:reduce)]:hidden"
      />

      <div className="bg-[var(--surface-1)]/40 border border-white/5 backdrop-blur rounded-2xl p-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted/50">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-balance text-foreground">How can I help you trade today?</h1>
              <p className="text-balance text-muted-foreground">
                Ask me about market analysis, trading strategies, or get real-time insights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="p-4 cursor-pointer transition-colors group text-left border border-white/5 hover:bg-muted/50 bg-[var(--surface-2)]"
                onClick={() => onQuickStart(suggestion.subtitle.replace(/"/g, ""))}
              >
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-card-foreground">{suggestion.title}</h3>
                  <p className="text-xs text-muted-foreground">{suggestion.subtitle}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
