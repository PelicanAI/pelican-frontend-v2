'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Zap, X, ArrowRight } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  required: number
  balance: number
}

export function UpgradeModal({ isOpen, onClose, required, balance }: UpgradeModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortfall = required - balance

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
            <Zap className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Not Enough Credits</h2>
          <p className="text-gray-400 text-sm mt-1">
            You need more credits to run this query
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-gray-400">Query cost</span>
            <span className="text-white font-medium">{required} credits</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-gray-400">Your balance</span>
            <span className="text-red-400 font-medium">{balance} credits</span>
          </div>
          <div className="border-t border-gray-700 my-3" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">You need</span>
            <span className="text-amber-400 font-semibold">{shortfall} more credits</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Credits reset monthly. Upgrade anytime for instant access.
        </p>
      </div>
    </div>
  )
}

