"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Lock, Mail, ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')

  // Store the plan parameter in sessionStorage for use after signup
  useEffect(() => {
    if (planParam) {
      // Map 'starter' from marketing site to 'base' used by pricing page
      const mappedPlan = planParam === 'starter' ? 'base' : planParam
      sessionStorage.setItem('intended_plan', mappedPlan)
    }
  }, [planParam])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service to continue")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error

      // If email confirmation is disabled, user is immediately logged in with a session
      if (data.session) {
        // User is logged in, redirect to pricing (new users need to subscribe)
        // Check if there's a pre-selected plan from the marketing site
        const storedPlan = sessionStorage.getItem('intended_plan')
        if (storedPlan) {
          router.push(`/pricing?plan=${storedPlan}`)
        } else {
          router.push('/pricing')
        }
        return
      }

      // No session means email confirmation is required
      // Redirect to confirmation screen
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      <div className="absolute top-6 left-6 z-30 pointer-events-auto">
        <a href="/" className="flex items-center text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </a>
      </div>

      <div className="w-full h-screen bg-[#12141c] rounded-none shadow-none overflow-hidden flex flex-col md:flex-row border-0 z-10">
        {/* LEFT SIDE: Visual & Branding (CSS-Only Version) */}
        <div className="hidden md:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-[#050505]">
            {/* BACKGROUND: Glowing Data Landscape (CSS Only) */}
            <div className="absolute inset-0 z-0 overflow-hidden">
               {/* 1. The Dark Base */}
               <div className="absolute inset-0 bg-[#020205]"></div>
               
               {/* 2. The "Mountain" Glows */}
               <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[60%] bg-purple-900/40 blur-[80px] rounded-full mix-blend-screen"></div>
               <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] bg-blue-900/30 blur-[80px] rounded-full mix-blend-screen"></div>
               
               {/* 3. The Grid Floor (Perspective) */}
               <div 
                 className="absolute inset-0 opacity-30" 
                 style={{
                    backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)',
                    transformOrigin: 'bottom center',
                    maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
                 }} 
               />
               
               {/* 4. Rising "Candlestick" Bars (Simulated with spans) */}
               <div className="absolute bottom-0 left-10 w-4 h-32 bg-gradient-to-t from-purple-600 to-transparent opacity-50 blur-sm"></div>
               <div className="absolute bottom-0 left-20 w-4 h-48 bg-gradient-to-t from-purple-500 to-transparent opacity-60 blur-sm"></div>
               <div className="absolute bottom-0 left-32 w-4 h-24 bg-gradient-to-t from-blue-600 to-transparent opacity-40 blur-sm"></div>
               <div className="absolute bottom-0 right-20 w-4 h-56 bg-gradient-to-t from-purple-400 to-transparent opacity-50 blur-sm"></div>
            </div>

            {/* Logo */}
            <div className="relative z-10 mb-12">
              <div className="w-72 h-72 relative">
                 <Image 
                   src="/pelican-logo-transparent.png" 
                   alt="Pelican Logo" 
                   width={288} 
                   height={288} 
                   className="object-contain" 
                 />
              </div>
            </div>

            {/* Hero Text */}
            <div className="relative z-10 mt-auto mb-6">
              <h1 className="text-5xl font-bold leading-tight mb-4 tracking-tight text-white drop-shadow-lg">
                Unlock Your Trading <br />
                Potential.
              </h1>
              <p className="text-gray-300 text-lg font-light max-w-sm leading-relaxed drop-shadow-md">
                Join thousands using AI to find their next big opportunity.
              </p>
            </div>
        </div>

        <div className="w-full md:w-1/2 bg-[#12141c] p-10 md:p-14 flex flex-col justify-center relative z-10 pointer-events-auto">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-semibold mb-2 text-white">Create your account</h2>
            <p className="text-gray-400 mb-8">Start trading smarter in minutes.</p>

            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-300 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    placeholder="trader@example.com"
                    className="w-full bg-[#1b1f2b] border border-[#2d3240] rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="password"
                    id="password"
                    className="w-full bg-[#1b1f2b] border border-[#2d3240] rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="repeat-password" className="text-sm font-medium text-gray-300 ml-1">Repeat Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="password"
                    id="repeat-password"
                    className="w-full bg-[#1b1f2b] border border-[#2d3240] rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-5 h-5 bg-[#1b1f2b] border-[#2d3240] rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-purple-600"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-400">
                  I agree to the <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">Terms of Service</Link>
                </label>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>

              <div className="text-center pt-4 pointer-events-auto">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <a href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Sign in
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
