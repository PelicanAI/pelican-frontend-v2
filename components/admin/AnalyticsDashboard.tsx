'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsChart } from '@/components/admin/AnalyticsChart'
import { HorizontalBarChart } from '@/components/admin/HorizontalBarChart'
import { ConversionFunnel } from '@/components/admin/ConversionFunnel'
import { DollarSign, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  daily_conversations_30d: { date: string; count: number }[]
  daily_signups_30d: { date: string; count: number }[]
  daily_messages_30d: { date: string; count: number }[]
  daily_credits_30d: { date: string; total_used: number }[]
  plan_distribution: { plan: string; count: number }[]
  top_tickers_30d: { ticker: string; count: number }[]
  user_activity_distribution: { bucket: string; count: number }[]
  conversion_funnel: { total_signups: number; active_trial: number; converted_paid: number; churned: number }
  mrr: number
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toChartData(series: { date: string; count: number }[]) {
  return series.map((d) => ({ label: formatDayLabel(d.date), value: d.count }))
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error(`Failed to fetch analytics (${res.status})`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="h-56 flex items-center justify-center">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{error ?? 'No data'}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPlanUsers = data.plan_distribution.reduce((s, p) => s + p.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className="size-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* MRR */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <DollarSign className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold tabular-nums">${data.mrr.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Time series charts — 2x2 grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart title="Messages Per Day" data={toChartData(data.daily_messages_30d)} />
        <AnalyticsChart
          title="Credit Consumption"
          data={data.daily_credits_30d.map((d) => ({ label: formatDayLabel(d.date), value: d.total_used }))}
        />
        <AnalyticsChart title="Conversations Per Day" data={toChartData(data.daily_conversations_30d)} />
        <AnalyticsChart title="Signups Per Day" data={toChartData(data.daily_signups_30d)} />
      </div>

      {/* Horizontal charts + funnel — 2-col grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HorizontalBarChart
          title="Popular Tickers (30 Days)"
          data={data.top_tickers_30d.map((t) => ({ label: t.ticker, value: t.count }))}
        />
        <HorizontalBarChart
          title="User Activity Distribution"
          data={data.user_activity_distribution.map((d) => ({ label: d.bucket, value: d.count }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ConversionFunnel data={data.conversion_funnel} />

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.plan_distribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {data.plan_distribution.map(({ plan, count }) => {
                  const pct = totalPlanUsers > 0 ? (count / totalPlanUsers) * 100 : 0
                  return (
                    <div key={plan} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{plan}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
