'use client'

import { useState, useCallback } from 'react'
import { useCredits } from './use-credits'

interface CreditResponse {
  credits_used?: number
  credits_remaining?: number
}

interface InsufficientCreditsError {
  error: 'insufficient_credits'
  required: number
  balance: number
  message?: string
}

export function useCreditAwareChat() {
  const { credits, updateBalance, refetch } = useCredits()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [creditError, setCreditError] = useState<InsufficientCreditsError | null>(null)
  const [lastQueryCost, setLastQueryCost] = useState<number | null>(null)

  const handleResponse = useCallback((response: CreditResponse) => {
    if (response.credits_remaining !== undefined) {
      updateBalance(response.credits_remaining)
    }
    if (response.credits_used !== undefined) {
      setLastQueryCost(response.credits_used)
    }
  }, [updateBalance])

  const handleInsufficientCredits = useCallback((error: InsufficientCreditsError) => {
    setCreditError(error)
    setShowUpgradeModal(true)
    if (error.balance !== undefined) {
      updateBalance(error.balance)
    }
  }, [updateBalance])

  const checkResponse = useCallback(async (response: Response): Promise<boolean> => {
    if (response.status === 402) {
      try {
        const error = await response.json()
        const errorData = error.detail || error
        handleInsufficientCredits(errorData)
        return true
      } catch {
        handleInsufficientCredits({
          error: 'insufficient_credits',
          required: 0,
          balance: credits?.balance || 0,
          message: 'Insufficient credits'
        })
        return true
      }
    }
    return false
  }, [handleInsufficientCredits, credits?.balance])

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false)
    setCreditError(null)
  }, [])

  const clearLastQueryCost = useCallback(() => {
    setLastQueryCost(null)
  }, [])

  return {
    credits,
    lastQueryCost,
    showUpgradeModal,
    creditError,
    handleResponse,
    handleInsufficientCredits,
    checkResponse,
    closeUpgradeModal,
    clearLastQueryCost,
    refetchCredits: refetch
  }
}

