"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import Link from "next/link"
import { SubscriptionCard } from "./SubscriptionCard"
import { SecuritySection } from "./SecuritySection"
import type { UserSettings } from "./types"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

interface AccountSectionProps {
  user: SupabaseUser | null
  settings: UserSettings
  supabase: SupabaseClient
}

export function AccountSection({ user, settings, supabase }: AccountSectionProps) {
  return (
    <>
      <div className="space-y-6">
        {!user && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Sign in to save your settings
                  </h3>
                  <p className="text-sm text-purple-700 mb-4">
                    You&apos;re currently using Pelican AI in guest mode. Create an account to save your preferences and access additional features.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700">
                      <Link href="/auth/signup">Create Account</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              {user ? "Review your account email" : "Sign in to view account details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={settings.email}
              disabled
              className="bg-muted dark:bg-[#0a0a0f] dark:border dark:border-white/5"
            />
            <p className="text-sm text-muted-foreground">Contact support to change your email address</p>
          </CardContent>
        </Card>

        {user && (
          <>
            <SubscriptionCard />
            <SecuritySection user={user} supabase={supabase} />
          </>
        )}
      </div>
    </>
  )
}
