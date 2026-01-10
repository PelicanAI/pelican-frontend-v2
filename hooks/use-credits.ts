'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreditInfo {
  balance: number
  plan: string
  monthlyAllocation: number
  usedThisMonth: number
  billingCycleStart: string | null
}

interface UseCreditsReturn {
  credits: CreditInfo | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateBalance: (newBalance: number) => void
}

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<CreditInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchCredits = useCallback(async () => {
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCredits(null)
        setLoading(false)
        return
      }

      const { data, error: rpcError } = await supabase
        .rpc('get_user_credits', { p_user_id: user.id })

      if (rpcError) {
        const { data: directData, error: directError } = await supabase
          .from('user_credits')
          .select('credits_balance, plan_type, plan_credits_monthly, credits_used_this_month, billing_cycle_start')
          .eq('user_id', user.id)
          .single()

        if (directError) {
          if (directError.code === 'PGRST116') {
            setCredits({
              balance: 0,
              plan: 'none',
              monthlyAllocation: 0,
              usedThisMonth: 0,
              billingCycleStart: null
            })
          } else {
            throw directError
          }
        } else if (directData) {
          setCredits({
            balance: directData.credits_balance,
            plan: directData.plan_type,
            monthlyAllocation: directData.plan_credits_monthly,
            usedThisMonth: directData.credits_used_this_month,
            billingCycleStart: directData.billing_cycle_start
          })
        }
      } else if (data) {
        setCredits({
          balance: data.balance,
          plan: data.plan,
          monthlyAllocation: data.monthly_allocation,
          usedThisMonth: data.used_this_month,
          billingCycleStart: data.billing_cycle_start
        })
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch credits')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateBalance = useCallback((newBalance: number) => {
    setCredits(prev => prev ? { ...prev, balance: newBalance } : null)
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('user_credits_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newData = payload.new as any
            setCredits({
              balance: newData.credits_balance,
              plan: newData.plan_type,
              monthlyAllocation: newData.plan_credits_monthly,
              usedThisMonth: newData.credits_used_this_month,
              billingCycleStart: newData.billing_cycle_start
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupSubscription()
  }, [supabase])

  return { 
    credits, 
    loading, 
    error,
    refetch: fetchCredits, 
    updateBalance 
  }
}

