'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCredits } from '@/hooks/use-credits'
import { X, PartyPopper, Zap } from 'lucide-react'

export function SubscriptionWelcomeBanner() {
  const [show, setShow] = useState(false)
  const [planName, setPlanName] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { credits, refetch } = useCredits()

  useEffect(() => {
    const subscribed = searchParams.get('subscribed')
    const plan = searchParams.get('plan')

    if (subscribed === 'true') {
      setPlanName(plan)
      setShow(true)
      refetch()

      const url = new URL(window.location.href)
      url.searchParams.delete('subscribed')
      url.searchParams.delete('plan')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, refetch, router])

  if (!show) return null

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-500/20 rounded-full">
            <PartyPopper className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-300">
              Welcome to Pelican{planName ? ` ${planName.charAt(0).toUpperCase() + planName.slice(1)}` : ''}! 🎉
            </h3>
            <p className="text-green-400/80 text-sm mt-1">
              {credits ? (
                <span className="flex items-center gap-1">
                  You have <Zap className="w-3.5 h-3.5" /> 
                  <strong>{credits.balance.toLocaleString()}</strong> credits ready to use.
                </span>
              ) : (
                'Your credits are being loaded...'
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-green-400/60 hover:text-green-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

