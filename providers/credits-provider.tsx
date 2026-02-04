'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCredits } from '@/hooks/use-credits'

interface CreditInfo {
  balance: number
  plan: string
  monthlyAllocation: number
  usedThisMonth: number
  billingCycleStart: string | null
  freeQuestionsRemaining: number
}

interface CreditsContextType {
  credits: CreditInfo | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateBalance: (newBalance: number) => void
  canAfford: (cost: number) => boolean
  isSubscribed: boolean
  isFounder: boolean
  isTrial: boolean
  hasAccess: boolean
}

const CreditsContext = createContext<CreditsContextType | null>(null)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { credits, loading, error, refetch, updateBalance } = useCredits()

  const canAfford = (cost: number): boolean => {
    if (!credits) return false
    return credits.balance >= cost
  }

  const isSubscribed = credits !== null && 
    credits.plan !== 'none' && 
    credits.plan !== 'canceled' &&
    credits.plan !== 'past_due'
  
  const isFounder = credits !== null && credits.plan === 'founder'
  const isTrial = credits !== null &&
    !isSubscribed &&
    credits.freeQuestionsRemaining > 0
  const hasAccess = isSubscribed || isFounder || isTrial

  return (
    <CreditsContext.Provider
      value={{
        credits,
        loading,
        error,
        refetch,
        updateBalance,
        canAfford,
        isSubscribed,
        isFounder,
        isTrial,
        hasAccess
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export function useCreditsContext() {
  const context = useContext(CreditsContext)
  if (!context) {
    throw new Error('useCreditsContext must be used within a CreditsProvider')
  }
  return context
}

