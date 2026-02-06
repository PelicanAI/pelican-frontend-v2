import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FunnelData {
  total_signups: number
  active_trial: number
  converted_paid: number
  churned: number
}

export function ConversionFunnel({ data }: { data: FunnelData }) {
  const max = Math.max(data.total_signups, 1)
  const steps = [
    { label: 'Total Signups', value: data.total_signups, color: 'bg-blue-500' },
    { label: 'Active Trial', value: data.active_trial, color: 'bg-amber-500' },
    { label: 'Converted Paid', value: data.converted_paid, color: 'bg-emerald-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => {
            const pct = (step.value / max) * 100
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {step.value.toLocaleString()}
                    {data.total_signups > 0 && (
                      <span className="ml-1">
                        ({((step.value / data.total_signups) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-6 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${step.color}`}
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
              </div>
            )
          })}
          {/* Churned shown separately */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-destructive">Churned</span>
              <span className="text-muted-foreground tabular-nums">
                {data.churned.toLocaleString()}
                {data.total_signups > 0 && (
                  <span className="ml-1">
                    ({((data.churned / data.total_signups) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 rounded bg-muted overflow-hidden mt-1">
              <div
                className="h-full rounded bg-destructive/70 transition-all"
                style={{ width: `${Math.max((data.churned / max) * 100, data.churned > 0 ? 1 : 0)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
