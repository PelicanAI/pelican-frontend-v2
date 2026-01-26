'use client'

import { useCreditsContext } from '@/providers/credits-provider'
import Link from 'next/link'
import { Zap, Lock, ArrowRight } from 'lucide-react'

interface PaywallGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PaywallGate({ children, fallback }: PaywallGateProps) {
  const { isSubscribed, isFounder, loading } = useCreditsContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isSubscribed && !isFounder) {
    if (fallback) {
      return <>{fallback}</>
    }

    return <DefaultPaywall />
  }

  return <>{children}</>
}

function DefaultPaywall() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-6">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Subscribe to Access Pelican
        </h1>
        <p className="text-muted-foreground mb-8">
          Get AI-powered market analysis, backtesting, and trading intelligence.
        </p>

        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-8 text-left">
          <div className="space-y-3">
            <Feature text="Real-time price checks and analysis" />
            <Feature text="Technical indicator breakdowns" />
            <Feature text="Event studies and correlations" />
            <Feature text="Multi-day tick analysis and backtesting" />
          </div>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>View Plans</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-muted-foreground text-sm mt-4">
          Starting at $29/month
        </p>
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <span className="text-foreground text-sm">{text}</span>
    </div>
  )
}

export function useSubscriptionRequired() {
  const { isSubscribed, loading, credits } = useCreditsContext()

  return {
    isSubscribed,
    loading,
    credits,
    requireSubscription: () => {
      if (!isSubscribed && !loading) {
        window.location.href = '/pricing'
      }
    }
  }
}

