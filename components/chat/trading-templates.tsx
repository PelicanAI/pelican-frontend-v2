"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Copy, Edit3, Send } from "lucide-react"

interface TradingTemplate {
  id: string
  title: string
  description: string
  template: string
  category: "journal" | "analysis" | "review"
  variables: string[]
}

const tradingTemplates: TradingTemplate[] = [
  {
    id: "trade-journal",
    title: "Trade Journal Entry",
    description: "Document your trade with all key details",
    template: `Trade Journal Entry:

Symbol: [SYMBOL]
Entry Price: [ENTRY_PRICE]
Exit Price: [EXIT_PRICE]
Position Size: [POSITION_SIZE]
Risk Amount: [RISK_AMOUNT]
P&L: [PNL]

Setup:
[DESCRIBE_SETUP]

Entry Reason:
[ENTRY_REASON]

Exit Reason:
[EXIT_REASON]

What went well:
[WHAT_WENT_WELL]

What could improve:
[WHAT_TO_IMPROVE]

Emotional state during trade:
[EMOTIONAL_STATE]

Key lessons:
[KEY_LESSONS]`,
    category: "journal",
    variables: [
      "SYMBOL",
      "ENTRY_PRICE",
      "EXIT_PRICE",
      "POSITION_SIZE",
      "RISK_AMOUNT",
      "PNL",
      "DESCRIBE_SETUP",
      "ENTRY_REASON",
      "EXIT_REASON",
      "WHAT_WENT_WELL",
      "WHAT_TO_IMPROVE",
      "EMOTIONAL_STATE",
      "KEY_LESSONS",
    ],
  },
  {
    id: "pre-market-analysis",
    title: "Pre-Market Analysis",
    description: "Structured pre-market preparation",
    template: `Pre-Market Analysis for [DATE]:

Market Overview:
- Major indices futures: [FUTURES_STATUS]
- Key economic events today: [ECONOMIC_EVENTS]
- Overnight news impact: [OVERNIGHT_NEWS]

Watchlist:
1. [SYMBOL_1] - [REASON_1]
2. [SYMBOL_2] - [REASON_2]
3. [SYMBOL_3] - [REASON_3]

Key Levels:
- SPY: Support [SPY_SUPPORT] | Resistance [SPY_RESISTANCE]
- QQQ: Support [QQQ_SUPPORT] | Resistance [QQQ_RESISTANCE]

Trading Plan:
- Max risk today: [MAX_RISK]
- Preferred setups: [PREFERRED_SETUPS]
- Market bias: [MARKET_BIAS]

Focus areas:
[FOCUS_AREAS]`,
    category: "analysis",
    variables: [
      "DATE",
      "FUTURES_STATUS",
      "ECONOMIC_EVENTS",
      "OVERNIGHT_NEWS",
      "SYMBOL_1",
      "REASON_1",
      "SYMBOL_2",
      "REASON_2",
      "SYMBOL_3",
      "REASON_3",
      "SPY_SUPPORT",
      "SPY_RESISTANCE",
      "QQQ_SUPPORT",
      "QQQ_RESISTANCE",
      "MAX_RISK",
      "PREFERRED_SETUPS",
      "MARKET_BIAS",
      "FOCUS_AREAS",
    ],
  },
  {
    id: "weekly-review",
    title: "Weekly Performance Review",
    description: "Comprehensive weekly trading review",
    template: `Weekly Trading Review - Week of [WEEK_DATE]:

Performance Summary:
- Total P&L: [TOTAL_PNL]
- Win Rate: [WIN_RATE]%
- Total Trades: [TOTAL_TRADES]
- Average Win: [AVG_WIN]
- Average Loss: [AVG_LOSS]
- Profit Factor: [PROFIT_FACTOR]

Best Trade:
[BEST_TRADE_DETAILS]

Worst Trade:
[WORST_TRADE_DETAILS]

Key Patterns Observed:
[KEY_PATTERNS]

Emotional Challenges:
[EMOTIONAL_CHALLENGES]

Rule Violations:
[RULE_VIOLATIONS]

What Worked Well:
[WHAT_WORKED]

Areas for Improvement:
[AREAS_TO_IMPROVE]

Goals for Next Week:
1. [GOAL_1]
2. [GOAL_2]
3. [GOAL_3]

Strategy Adjustments:
[STRATEGY_ADJUSTMENTS]`,
    category: "review",
    variables: [
      "WEEK_DATE",
      "TOTAL_PNL",
      "WIN_RATE",
      "TOTAL_TRADES",
      "AVG_WIN",
      "AVG_LOSS",
      "PROFIT_FACTOR",
      "BEST_TRADE_DETAILS",
      "WORST_TRADE_DETAILS",
      "KEY_PATTERNS",
      "EMOTIONAL_CHALLENGES",
      "RULE_VIOLATIONS",
      "WHAT_WORKED",
      "AREAS_TO_IMPROVE",
      "GOAL_1",
      "GOAL_2",
      "GOAL_3",
      "STRATEGY_ADJUSTMENTS",
    ],
  },
]

interface TradingTemplatesProps {
  onTemplateSelect: (template: string) => void
  className?: string
}

export function TradingTemplates({ onTemplateSelect, className }: TradingTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TradingTemplate | null>(null)
  const [editedTemplate, setEditedTemplate] = useState("")

  const categories = {
    journal: { name: "Trade Journal", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    analysis: { name: "Market Analysis", color: "bg-green-500/10 text-green-700 dark:text-green-300" },
    review: { name: "Performance Review", color: "bg-primary/10 text-primary" },
  }

  const handleTemplateClick = (template: TradingTemplate) => {
    setSelectedTemplate(template)
    setEditedTemplate(template.template)
  }

  const handleCopyTemplate = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(editedTemplate)
    }
  }

  const handleSendTemplate = () => {
    onTemplateSelect(editedTemplate)
    setSelectedTemplate(null)
    setEditedTemplate("")
  }

  const groupedTemplates = tradingTemplates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category]!.push(template)
      return acc
    },
    {} as Record<string, TradingTemplate[]>,
  )

  if (selectedTemplate) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedTemplate.title}</h3>
            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
            Back
          </Button>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="text-sm font-medium">Edit Template</span>
              <Badge variant="secondary" className="text-xs">
                Fill in the [VARIABLES] with your data
              </Badge>
            </div>

            <Textarea
              value={editedTemplate}
              onChange={(e) => setEditedTemplate(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Edit your template here..."
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopyTemplate}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={handleSendTemplate}>
                <Send className="h-4 w-4 mr-2" />
                Send to Pelican
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Trading Templates</h2>
        <p className="text-muted-foreground">Pre-built templates for journaling, analysis, and reviews</p>
      </div>

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category} className="space-y-3">
          <Badge className={categories[category as keyof typeof categories].color}>
            {categories[category as keyof typeof categories].name}
          </Badge>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleTemplateClick(template)}
              >
                <div className="space-y-2">
                  <h3 className="font-medium">{template.title}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
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
