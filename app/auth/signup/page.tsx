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
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex justify-start">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-purple-600">
              <Link href="/" className="flex items-center gap-2">
                ← Back to Home
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <Image
              src="/pelican-logo-transparent.png"
              alt="Pelican AI"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">Join Pelican AI</h1>
              <p className="text-sm text-muted-foreground">Create your account to start trading smarter</p>
            </div>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create a new account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="trader@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      I agree to the{" "}
                      <Link href="/terms" className="text-purple-600 hover:underline" target="_blank">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4 text-purple-600">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
