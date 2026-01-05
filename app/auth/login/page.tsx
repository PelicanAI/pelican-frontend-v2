"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check subscription status
      if (data.user) {
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('plan_type, is_founder')
          .eq('user_id', data.user.id)
          .single()

        // Valid plan types that grant access
        const validPlans = ['base', 'pro', 'power', 'founder', 'starter']
        const hasSubscription = userCredits?.is_founder || 
          (userCredits?.plan_type && validPlans.includes(userCredits.plan_type))

        // Redirect based on subscription status
        if (hasSubscription) {
          router.push("/chat")
        } else {
          router.push("/pricing")
        }
      } else {
        router.push("/pricing")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-black relative overflow-hidden">
      {/* Futuristic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-violet-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_50%)]" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex justify-start">
            <Button variant="ghost" asChild className="text-gray-400 hover:text-white transition-colors">
              <Link href="/" className="flex items-center gap-2">
                ← Back to Home
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* Logo - clean and visible */}
            <div className="relative group">
              <Image
                src="/pelican-logo.png"
                alt="Pelican AI"
                width={80}
                height={80}
                className="w-20 h-20 object-contain brightness-110 saturate-110 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]"
              />
            </div>

            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Pelican AI
            </h1>
            <p className="text-gray-400 text-center">Sign in to continue your trading journey</p>
          </div>

          <Card className="border-purple-900/50 bg-black/40 backdrop-blur-xl shadow-2xl shadow-purple-900/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Login</CardTitle>
              <CardDescription className="text-gray-400">Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-gray-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="trader@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/50 border-purple-900/50 text-white placeholder:text-gray-500 focus:border-purple-600 focus:ring-purple-600/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-gray-200">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/50 border-purple-900/50 text-white placeholder:text-gray-500 focus:border-purple-600 focus:ring-purple-600/20"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-lg bg-red-950/50 border border-red-900/50">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-700 hover:via-violet-700 hover:to-purple-700 text-white shadow-lg shadow-purple-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/60 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <span className="text-gray-400">Don&apos;t have an account?</span>{" "}
                  <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors font-medium">
                    Sign up
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
