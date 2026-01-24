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
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[500px]">
      <div className="max-w-2xl mx-auto text-center space-y-6 sm:space-y-8 w-full">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 h-10 sm:h-12">
          <img 
            src="/pelican-logo-transparent.png" 
            alt="PelicanAI" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            width="48"
            height="48" 
          />
        </div>

        {/* Welcome Message */}
        <div className="space-y-3 sm:space-y-4 min-h-[80px] sm:min-h-[100px] px-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-balance">How can I help you trade today?</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-balance">
            Ask me about market analysis, trading strategies, or get real-time insights
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 sm:mt-8 min-h-[200px]">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors text-left min-h-[72px] sm:h-20 flex flex-col justify-center"
              onClick={() => onQuickStart(suggestion.message)}
            >
              <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground">&quot;{suggestion.subtitle}&quot;</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
