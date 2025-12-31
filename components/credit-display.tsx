'use client'

import { useCredits } from '@/hooks/use-credits'
import Link from 'next/link'
import { Zap, AlertTriangle } from 'lucide-react'

interface CreditDisplayProps {
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function CreditDisplay({ variant = 'default', className = '' }: CreditDisplayProps) {
  const { credits, loading } = useCredits()

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (!credits || credits.plan === 'none') {
    return (
      <Link 
        href="/pricing" 
        className={`flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors ${className}`}
      >
        <Zap className="w-4 h-4" />
        <span>Subscribe to start</span>
      </Link>
    )
  }

  if (credits.plan === 'founder') {
    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Founder</span>
        </div>
      )
    }
    
    if (variant === 'detailed') {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Founder Account</span>
          </div>
          <p className="text-xs text-gray-500">Unlimited access</p>
        </div>
      )
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-400">Founder</span>
      </div>
    )
  }

  const isLow = credits.balance < 50
  const isCritical = credits.balance < 20

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Zap className={`w-3.5 h-3.5 ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-400'}`} />
        <span className={`text-sm font-medium ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-300'}`}>
          {credits.balance.toLocaleString()}
        </span>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Credits</span>
          <span className={`text-sm font-semibold ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-200'}`}>
            {credits.balance.toLocaleString()}
          </span>
        </div>
        
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ 
              width: `${Math.min(100, (credits.balance / credits.monthlyAllocation) * 100)}%` 
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{credits.usedThisMonth.toLocaleString()} used</span>
          <span>{credits.monthlyAllocation.toLocaleString()} / month</span>
        </div>

        {isLow && (
          <Link 
            href="/pricing" 
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <AlertTriangle className="w-3 h-3" />
            Get more credits
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Zap className={`w-4 h-4 ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-400'}`} />
      <span className={`text-sm font-medium ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-300'}`}>
        {credits.balance.toLocaleString()} credits
      </span>
      
      {isLow && (
        <Link 
          href="/pricing" 
          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
        >
          Get more
        </Link>
      )}
    </div>
  )
}

