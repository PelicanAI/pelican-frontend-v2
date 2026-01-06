'use client'

import { Zap } from 'lucide-react'

interface CreditCostBadgeProps {
  cost: number
  className?: string
}

export function CreditCostBadge({ cost, className = '' }: CreditCostBadgeProps) {
  if (!cost || cost <= 0) return null

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Zap className="w-3 h-3" />
      <span>-{cost} credits</span>
    </div>
  )
}

export const QUERY_COSTS = {
  conversation: { label: 'Chat', cost: 2 },
  simple: { label: 'Price Check', cost: 10 },
  basic: { label: 'Technical Analysis', cost: 25 },
  event_study: { label: 'Event Study', cost: 75 },
  multi_day_tick: { label: 'Deep Analysis', cost: 250 },
} as const

export type QueryType = keyof typeof QUERY_COSTS

interface QueryCostPreviewProps {
  queryType: QueryType
  className?: string
}

export function QueryCostPreview({ queryType, className = '' }: QueryCostPreviewProps) {
  const { label, cost } = QUERY_COSTS[queryType]

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground flex items-center gap-1">
        <Zap className="w-3 h-3" />
        {cost} credits
      </span>
    </div>
  )
}

export function CostBreakdownTable() {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">What things cost</h3>
      <div className="space-y-2.5">
        {Object.entries(QUERY_COSTS).map(([key, { label, cost }]) => (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-foreground">{label}</span>
            <span className="text-foreground font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-muted-foreground" />
              {cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

