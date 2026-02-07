"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function getHashParams() {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : ""
  return new URLSearchParams(hash)
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const hydrateSession = async () => {
      const supabase = createClient()

      const { data } = await supabase.auth.getSession()
      if (data.session) return

      const hashParams = getHashParams()
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const code = new URLSearchParams(window.location.search).get("code")

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
    }

    void hydrateSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess("Password updated. You can now sign in.")
      setPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden font-sans text-white p-4">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/30 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-[4s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[100px] rounded-full mix-blend-screen" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="mb-8 flex items-center justify-between text-sm text-gray-400">
          <Link href="/auth/login" className="inline-flex items-center hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
        </div>

        <div className="bg-[#12141c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 mb-4 relative">
              <Image
                src="/pelican-logo-transparent.webp"
                alt="Pelican Logo"
                width={48}
                height={48}
                className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create a new password</h1>
            <p className="text-sm text-gray-400 mt-2">
              Choose a strong password you don&apos;t use elsewhere.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-300 ml-1 uppercase tracking-wider">
                New password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="password"
                  type="password"
                  className="w-full bg-[#0a0a0c]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all hover:bg-[#0a0a0c]/80"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-300 ml-1 uppercase tracking-wider">
                Confirm password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full bg-[#0a0a0c]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all hover:bg-[#0a0a0c]/80"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-400">
                {success}{" "}
                <Link href="/auth/login" className="underline underline-offset-4 text-emerald-300 hover:text-emerald-200">
                  Sign in
                </Link>
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

