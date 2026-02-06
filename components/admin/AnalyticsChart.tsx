import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataPoint {
  label: string
  value: number
}

interface AnalyticsChartProps {
  title: string
  data: DataPoint[]
}

export function AnalyticsChart({ title, data }: AnalyticsChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="text-sm text-muted-foreground">
          Total: {total.toLocaleString()}
        </span>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No data available
          </p>
        ) : (
          <div className="flex items-end gap-px h-40">
            {data.map((point, i) => {
              const height = (point.value / max) * 100
              return (
                <div
                  key={i}
                  className="group relative flex-1 h-full flex flex-col justify-end"
                >
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(height, 1.5)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="rounded bg-popover border border-border px-2 py-1 text-xs shadow-md whitespace-nowrap">
                      <p className="font-medium">{point.value}</p>
                      <p className="text-muted-foreground">{point.label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* X-axis labels — show first, middle, last */}
        {data.length > 0 && (
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{data[0]?.label}</span>
            {data.length > 2 && (
              <span>{data[Math.floor(data.length / 2)]?.label}</span>
            )}
            <span>{data[data.length - 1]?.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
