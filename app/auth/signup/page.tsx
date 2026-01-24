"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Lock, Mail } from "lucide-react"

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
    <div className="min-h-svh bg-[#0b0f1a] p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-purple-200">
            <Link href="/" className="flex items-center gap-2">
              ← Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#0d111c] shadow-2xl lg:grid-cols-2">
          {/* Left marketing panel */}
          <div className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-[#0a0d16] px-10 py-12 lg:flex">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_55%)]" />
              <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_30%_30%,_rgba(168,85,247,0.25),_transparent_60%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-72 bg-[linear-gradient(120deg,_rgba(91,33,182,0.35),_rgba(37,99,235,0.18))]" />
              <div className="absolute bottom-0 left-0 right-0 h-72 opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(transparent 55%, rgba(17,24,39,0.8)), linear-gradient(120deg, rgba(168,85,247,0.55), rgba(59,130,246,0.35)), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 40px), repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 40px)",
                }}
              />
            </div>

            <div className="relative z-10">
              <Image
                src="/pelican-logo-transparent.png"
                alt="Pelican AI"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>

            <div className="relative z-10 space-y-4">
              <h1 className="text-4xl font-semibold text-white">
                Unlock Your Trading
                <br />
                Potential.
              </h1>
              <p className="max-w-sm text-base text-white/70">
                Join thousands using AI to find their next big opportunity.
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="bg-[#0f121b] px-8 py-10 md:px-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Create your account</h2>
                <p className="text-sm text-white/60">Start trading smarter in minutes.</p>
              </div>

              <Card className="border-white/10 bg-white/5 text-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl">Sign up</CardTitle>
                  <CardDescription className="text-white/60">Create a new account to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-white/80">Email</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="trader@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 border-white/10 bg-[#151a26] pl-10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-white/80">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 border-white/10 bg-[#151a26] pl-10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="repeat-password" className="text-white/80">Repeat Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input
                            id="repeat-password"
                            type="password"
                            required
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            className="h-11 border-white/10 bg-[#151a26] pl-10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-purple-500 focus:ring-purple-500"
                        />
                        <Label htmlFor="terms" className="text-sm text-white/60 leading-tight">
                          I agree to the{" "}
                          <Link href="/terms" className="text-purple-400 hover:underline" target="_blank">
                            Terms of Service
                          </Link>
                        </Label>
                      </div>
                      {error && <p className="text-sm text-red-400">{error}</p>}
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : "Create account"}
                      </Button>
                    </div>
                    <div className="mt-4 text-center text-sm text-white/60">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="text-purple-400 hover:underline">
                        Sign in
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
