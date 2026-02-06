import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BarItem {
  label: string
  value: number
}

interface HorizontalBarChartProps {
  title: string
  data: BarItem[]
  maxItems?: number
}

export function HorizontalBarChart({ title, data, maxItems = 15 }: HorizontalBarChartProps) {
  const items = data.slice(0, maxItems)
  const max = Math.max(...items.map((d) => d.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const pct = (item.value / max) * 100
              return (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 truncate font-mono text-xs font-medium text-right">
                    {item.label}
                  </span>
                  <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-primary/70 transition-all"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right tabular-nums text-xs text-muted-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
