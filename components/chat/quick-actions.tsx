"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Target,
  BookOpen,
  Zap,
  Clock,
} from "lucide-react"

interface QuickAction {
  id: string
  title: string
  description: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
  category: "analysis" | "psychology" | "risk" | "education"
  badge?: string
}

const quickActions: QuickAction[] = [
  // Analysis Actions
  {
    id: "market-overview",
    title: "Market Overview",
    description: "Get current market conditions and sentiment",
    prompt:
      "Give me a comprehensive overview of current market conditions, including major indices, sector performance, and overall market sentiment.",
    icon: TrendingUp,
    category: "analysis",
    badge: "Live Data",
  },
  {
    id: "trade-analysis",
    title: "Analyze My Trade",
    description: "Upload a screenshot for detailed trade analysis",
    prompt:
      "I want to analyze a trade. Please help me upload a screenshot and provide detailed feedback on entry, exit, and overall execution.",
    icon: BarChart3,
    category: "analysis",
  },
  {
    id: "earnings-calendar",
    title: "Earnings This Week",
    description: "Key earnings reports and their potential impact",
    prompt:
      "What are the most important earnings reports coming up this week, and how might they impact the broader market?",
    icon: DollarSign,
    category: "analysis",
    badge: "Weekly",
  },

  // Psychology Actions
  {
    id: "fomo-help",
    title: "Overcome FOMO",
    description: "Strategies to manage fear of missing out",
    prompt:
      "I'm struggling with FOMO in my trading. Help me develop strategies to stay disciplined and avoid impulsive trades.",
    icon: Brain,
    category: "psychology",
  },
  {
    id: "loss-recovery",
    title: "After a Loss",
    description: "Mental reset and recovery strategies",
    prompt:
      "I just had a significant trading loss and I'm feeling emotional. Help me process this and get back to a clear mindset.",
    icon: AlertTriangle,
    category: "psychology",
  },
  {
    id: "confidence-building",
    title: "Build Confidence",
    description: "Develop consistent trading confidence",
    prompt:
      "I lack confidence in my trading decisions. Help me build a systematic approach to increase my conviction and reduce second-guessing.",
    icon: Target,
    category: "psychology",
  },

  // Risk Management Actions
  {
    id: "position-sizing",
    title: "Position Sizing",
    description: "Calculate optimal position sizes",
    prompt:
      "Help me calculate the optimal position size for my next trade. My account size is [ACCOUNT_SIZE] and I want to risk [RISK_PERCENT]% per trade.",
    icon: Shield,
    category: "risk",
  },
  {
    id: "risk-review",
    title: "Risk Assessment",
    description: "Review your current risk management",
    prompt:
      "Review my current risk management strategy and suggest improvements. I want to ensure I'm protecting my capital effectively.",
    icon: AlertTriangle,
    category: "risk",
  },

  // Education Actions
  {
    id: "strategy-explanation",
    title: "Explain Strategy",
    description: "Learn about specific trading strategies",
    prompt:
      "Explain the [STRATEGY_NAME] trading strategy, including entry/exit criteria, risk management, and when it works best.",
    icon: BookOpen,
    category: "education",
  },
  {
    id: "market-mechanics",
    title: "Market Mechanics",
    description: "Understand how markets work",
    prompt: "Explain how market makers, institutional flow, and retail sentiment interact to create price movements.",
    icon: Zap,
    category: "education",
  },
  {
    id: "daily-routine",
    title: "Trading Routine",
    description: "Build a consistent daily routine",
    prompt:
      "Help me create a comprehensive daily trading routine that includes pre-market analysis, during-market execution, and post-market review.",
    icon: Clock,
    category: "education",
  },
]

interface QuickActionsProps {
  onActionSelect: (prompt: string) => void
  className?: string
}

export function QuickActions({ onActionSelect, className }: QuickActionsProps) {
  const categories = {
    analysis: { name: "Market Analysis", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    psychology: { name: "Trading Psychology", color: "bg-primary/10 text-primary" },
    risk: { name: "Risk Management", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
    education: { name: "Education", color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  }

  const groupedActions = quickActions.reduce(
    (acc, action) => {
      const category = action.category
      if (!acc[category]) {
        acc[category] = []
      }
      const categoryArray = acc[category]
      if (categoryArray) {
        categoryArray.push(action)
      }
      return acc
    },
    {} as Record<string, QuickAction[]>,
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <p className="text-muted-foreground">Get started with common trading scenarios and questions</p>
      </div>

      {Object.entries(groupedActions).map(([category, actions]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={categories[category as keyof typeof categories].color}>
              {categories[category as keyof typeof categories].name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((action) => (
              <Card
                key={action.id}
                className="p-4 cursor-pointer hover:bg-muted transition-colors group"
                onClick={() => onActionSelect(action.prompt)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
