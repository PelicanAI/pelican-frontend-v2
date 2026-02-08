"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function AcceptTermsPage() {
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setCheckingAuth(false)
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth/login")
        return
      }

      const now = new Date().toISOString()

      // Try updating the existing row first (preserves credits, plan, etc.)
      const { data: updated } = await supabase
        .from("user_credits")
        .update({ terms_accepted: true, terms_accepted_at: now })
        .eq("user_id", user.id)
        .select("user_id")

      // If no row was updated, the user_credits row doesn't exist yet
      // (race condition: DB trigger may not have fired yet for new OAuth users)
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: user.id,
            terms_accepted: true,
            terms_accepted_at: now,
            free_questions_remaining: 10,
            plan_type: "none",
            credits_balance: 0,
            is_admin: false,
          })

        if (insertError) {
          // If insert fails with conflict, the trigger just created the row —
          // retry the update once
          if (insertError.code === "23505") {
            const { error: retryError } = await supabase
              .from("user_credits")
              .update({ terms_accepted: true, terms_accepted_at: now })
              .eq("user_id", user.id)

            if (retryError) {
              console.error("[ACCEPT-TERMS] Retry update error:", retryError)
              setError("Something went wrong. Please try again.")
              return
            }
          } else {
            console.error("[ACCEPT-TERMS] Insert error:", insertError)
            setError("Something went wrong. Please try again.")
            return
          }
        }
      }

      router.replace("/chat")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c]">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden font-sans text-white p-4">
      {/* Background effects matching login page */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(circle at center, black 40%, transparent 100%)",
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/30 blur-[120px] rounded-full mix-blend-screen" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col">
        <div className="bg-[#12141c]/80 backdrop-blur-xl border-t border-t-white/20 border-b border-b-black/50 border-x border-x-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 mb-4 relative">
              <Image
                src="/pelican-logo-transparent.webp"
                alt="Pelican Logo"
                width={80}
                height={80}
                className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              To continue, please accept our Terms of Service.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 w-5 h-5 bg-[#1b1f2b] border-[#2d3240] rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-purple-600"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                I have read and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2"
                >
                  Terms of Service
                </Link>
              </label>
            </div>

            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={!agreed || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600 disabled:active:scale-100"
            >
              {isLoading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
