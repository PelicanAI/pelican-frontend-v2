"use client"

import { Card } from "@/components/ui/card"

interface ChatWelcomeProps {
  onQuickStart: (message: string) => void
}

export function ChatWelcome({ onQuickStart }: ChatWelcomeProps) {
  const suggestions = [
    {
      title: "Analyze a stock",
      subtitle: "What's your take on NVDA?",
      message: "What's your take on NVDA?",
    },
    {
      title: "Trading strategy",
      subtitle: "Help me with risk management",
      message: "Help me with risk management",
    },
    {
      title: "Market overview",
      subtitle: "What's moving the market?",
      message: "What's moving the market?",
    },
    {
      title: "Options play",
      subtitle: "Find me a bullish strategy",
      message: "Find me a bullish strategy",
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/pelican-logo.png" alt="PelicanAI" className="w-12 h-12 object-contain" />
        </div>

        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-balance">How can I help you trade today?</h1>
          <p className="text-muted-foreground text-balance">
            Ask me about market analysis, trading strategies, or get real-time insights
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors text-left"
              onClick={() => onQuickStart(suggestion.message)}
            >
              <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground">"{suggestion.subtitle}"</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
