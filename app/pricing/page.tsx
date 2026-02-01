'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Check, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreditsContext } from '@/providers/credits-provider'

const QUERY_COSTS = {
  conversation: { label: 'Chat / Education', cost: 2 },
  simple: { label: 'Price check', cost: 10 },
  basic: { label: 'Technical analysis', cost: 25 },
  event_study: { label: 'Event study', cost: 75 },
  multi_day_tick: { label: 'Deep analysis / Backtest', cost: 250 },
}

function CostBreakdownTable() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3 text-center">What things cost</h3>
      <div className="space-y-2.5">
        {Object.entries(QUERY_COSTS).map(([key, { label, cost }]) => (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-gray-300">{label}</span>
            <span className="text-white font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-gray-500" />
              {cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PLANS = [
  {
    id: 'base',
    name: 'Base',
    price: 29,
    credits: 1000,
    description: '~100 price checks or ~40 analyses',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    popular: false,
    features: [
      '1,000 credits/month',
      'All query types',
      'Email support',
      '20% rollover'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    credits: 3500,
    description: '~350 price checks or ~140 analyses',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    popular: true,
    features: [
      '3,500 credits/month',
      'All query types',
      'Priority support',
      '20% rollover',
      'API access (coming soon)'
    ]
  },
  {
    id: 'power',
    name: 'Power',
    price: 249,
    credits: 10000,
    description: '~1,000 price checks or ~400 analyses',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_POWER_PRICE_ID || 'price_power',
    popular: false,
    features: [
      '10,000 credits/month',
      'All query types',
      'Priority support',
      '20% rollover',
      'API access (coming soon)',
      'Custom integrations'
    ]
  }
]

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPlan = searchParams.get('plan')
  const { isSubscribed, isFounder, loading: creditsLoading } = useCreditsContext()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  // Redirect users who already have an active subscription to chat
  useEffect(() => {
    if (!creditsLoading && (isSubscribed || isFounder)) {
      router.push('/chat')
    }
  }, [isSubscribed, isFounder, creditsLoading, router])

  // Auto-select plan if arriving with ?plan= parameter
  useEffect(() => {
    if (preselectedPlan && user && !loadingPlan && !isSubscribed && !isFounder) {
      const plan = PLANS.find(p => p.id === preselectedPlan)
      if (plan) {
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          handleSelectPlan(plan)
        }, 100)
      }
      // Clear from sessionStorage after use
      sessionStorage.removeItem('intended_plan')
    }
  }, [preselectedPlan, user, loadingPlan, isSubscribed, isFounder])

  const handleSelectPlan = async (plan: typeof PLANS[0]) => {
    setLoadingPlan(plan.id)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        sessionStorage.setItem('intended_plan', plan.id)
        window.location.href = '/auth/login?redirect=/pricing'
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email,
          planName: plan.id,
          planCredits: plan.credits
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoadingPlan(null)
    }
  }

  // Show loading while checking subscription status
  if (creditsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  // If user has subscription, they'll be redirected by useEffect
  // Show pricing page for non-subscribed users
  return (
    <div className="min-h-[100svh] bg-gray-950 py-12">
      <div className="page-container-wide">
        <div className="text-center mb-12">
          <Link href="/chat" className="text-gray-500 hover:text-gray-400 text-sm mb-4 inline-block">
            ← Back to chat
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, Credit-Based Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Pay for what you use. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="max-w-sm mx-auto mb-12">
          <CostBreakdownTable />
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl p-6 transition-all ${
                plan.popular
                  ? 'bg-blue-600 ring-2 ring-blue-400 scale-105'
                  : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-white mt-2">{plan.name}</h2>

              <div className="mt-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className={plan.popular ? 'text-blue-200' : 'text-gray-400'}>/month</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <Zap className={`w-4 h-4 ${plan.popular ? 'text-blue-200' : 'text-gray-400'}`} />
                <span className="text-lg text-white font-semibold">
                  {plan.credits.toLocaleString()} credits
                </span>
              </div>

              <p className={`mt-2 text-sm ${plan.popular ? 'text-blue-200' : 'text-gray-400'}`}>
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.popular ? 'text-blue-200' : 'text-green-400'
                    }`} />
                    <span className={`text-sm ${plan.popular ? 'text-white' : 'text-gray-300'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingPlan !== null}
                className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Get Started</span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-gray-500 text-sm">
            Credits reset monthly. Unused credits roll over (up to 20%).
          </p>
          <p className="text-gray-500 text-sm">
            By subscribing, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </Link>
          </p>
          <p className="text-gray-500 text-sm">
            Questions?{' '}
            <a href="mailto:support@pelicantrading.ai" className="text-blue-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

