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
      title: "Technical Analysis",
      subtitle: "Analyze $SPY with technical indicators",
      icon: "📊",
    },
    {
      title: "Options Scanner",
      subtitle: "Find options plays expiring this week",
      icon: "🎯",
    },
    {
      title: "High IV Stocks",
      subtitle: "Show me high IV rank stocks",
      icon: "⚡",
    },
    {
      title: "Market Sentiment",
      subtitle: "What's the market sentiment today?",
      icon: "🌡️",
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
              <h1 className="text-4xl font-semibold text-balance text-foreground tracking-tight">How can I help you trade today?</h1>
              <p className="text-base text-balance text-muted-foreground leading-relaxed">
                Ask me about market analysis, trading strategies, or get real-time insights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="min-h-[72px] p-4 cursor-pointer transition-all duration-200 group text-left border border-white/5 hover:bg-muted/50 bg-[var(--surface-2)] hover:scale-[1.02] hover:shadow-lg rounded-xl"
                onClick={() => onQuickStart(suggestion.subtitle)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {suggestion.icon}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-semibold text-[15px] text-card-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.subtitle}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
