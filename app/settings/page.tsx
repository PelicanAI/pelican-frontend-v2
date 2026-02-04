"use client"

/**
 * Settings Page
 * 
 * User settings, preferences, and account management.
 * Uses RLS-safe operations for all database interactions.
 * 
 * @version 2.0.0 - UUID Migration Compatible
 */

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  ArrowLeft,
  User,
  TrendingUp,
  Shield,
  Trash2,
  Save,
  Loader2,
  Zap,
  Crown,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { CreditDisplay } from "@/components/credit-display"
import { ManageSubscriptionButton } from "@/components/manage-subscription-button"
import { useCreditsContext } from "@/providers/credits-provider"
import { LanguageSelector } from "@/components/language-selector"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  upsertUserSettings,
  clearUserData,
  isValidUUID,
  logRLSError
} from "@/lib/supabase/helpers"

// ============================================================================
// Types
// ============================================================================

interface UserSettings {
  // Account
  email: string

  // Trading Preferences
  default_timeframes: string[]
  preferred_markets: string[]
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  default_position_size?: number
  favorite_tickers: string[]
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  default_timeframes: ["5m", "15m", "1h"],
  preferred_markets: ["stocks"],
  risk_tolerance: "moderate",
  favorite_tickers: [],
}

const POPULAR_TICKERS = [
  "SPY", "QQQ", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL",
  "META", "AMD", "NFLX", "DIS", "INTC", "BABA", "NIO", "PLTR"
]

// ============================================================================
// Component
// ============================================================================

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { credits, isSubscribed, isFounder } = useCreditsContext()

  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeSection, setActiveSection] = useState("account")

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Delete account confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Clear history confirmation
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false)

  // Ticker input
  const [tickerInput, setTickerInput] = useState("")

  // Fetch user settings
  const { data: userSettings, mutate } = useSWR(
    user ? `/api/settings/${user.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .single()

      if (error && error.code !== "PGRST116") {
        logger.error("Failed to fetch user settings", error)
        throw error
      }

      return data || {}
    }
  )

  useEffect(() => {
    if (userSettings) {
      setSettings({
        email: user?.email || "",
        ...DEFAULT_SETTINGS,
        ...userSettings,
      } as UserSettings)
    } else if (user) {
      setSettings({
        email: user.email || "",
        ...DEFAULT_SETTINGS,
      } as UserSettings)
    } else {
      // Guest mode - use default settings
      setSettings({
        email: "",
        ...DEFAULT_SETTINGS,
      } as UserSettings)
    }
  }, [userSettings, user])

  // Theme is managed globally by ThemeProvider - no need to force light mode

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
      setHasUnsavedChanges(true)
    }
  }

  // ============================================================================
  // Save Settings (RLS-safe)
  // ============================================================================

  const handleSave = async () => {
    if (!user || !settings) return

    // Validate user.id is a valid UUID
    if (!isValidUUID(user.id)) {
      logger.error("Invalid user ID format")
      toast.error("Invalid user session. Please sign in again.")
      return
    }

    setIsSaving(true)
    try {
      const { success, error } = await upsertUserSettings(supabase, user.id, settings as unknown as Record<string, unknown>)

      if (!success || error) {
        logRLSError('upsert', 'user_settings', error, { userId: user.id })
        throw error || new Error('Failed to save settings')
      }

      await mutate()
      setHasUnsavedChanges(false)
      toast.success("Settings saved successfully")
      logger.info("Settings saved", { userId: user.id })
    } catch (error) {
      logger.error("Failed to save settings", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================================
  // Password Change
  // ============================================================================

  const handlePasswordChange = async () => {
    if (!user) return

    if (!currentPassword) {
      toast.error("Enter your current password")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (!user.email) {
      toast.error("Missing account email. Please sign in again.")
      return
    }

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (reauthError) {
        throw reauthError
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      logger.info("Password changed", { userId: user.id })
    } catch (error) {
      logger.error("Failed to change password", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to change password. Please try again.")
    }
  }

  // ============================================================================
  // Delete Account (RLS-safe)
  // ============================================================================

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== "DELETE") return

    // Validate user.id is a valid UUID
    if (!isValidUUID(user.id)) {
      logger.error("Invalid user ID format")
      toast.error("Invalid user session. Please sign in again.")
      return
    }

    try {
      // Delete user data using RLS-safe helper
      const { results, allSuccess } = await clearUserData(
        supabase,
        user.id,
        ['conversations', 'messages', 'user_settings']
      )

      // Log any failures
      Object.entries(results).forEach(([table, result]) => {
        if (result.error) {
          logRLSError('delete', table, result.error, { userId: user.id })
        } else {
          logger.info(`Deleted ${result.count} rows from ${table}`, { userId: user.id })
        }
      })

      if (!allSuccess) {
        logger.warn("Some data deletion failed", { results })
        // Continue with account deletion anyway - data will be orphaned but inaccessible
      }

      // Sign out the user (this is what we can do client-side)
      // Note: Full account deletion requires admin API or server-side function
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        logger.error("Failed to sign out after account deletion", signOutError)
      }

      toast.success("Account data deleted successfully")
      router.push("/")
      logger.info("Account deleted", { userId: user.id })
    } catch (error) {
      logger.error("Failed to delete account", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to delete account. Please contact support.")
    }
  }

  // ============================================================================
  // Clear History (RLS-safe)
  // ============================================================================

  const handleClearHistory = async () => {
    if (!user) return

    // Validate user.id is a valid UUID
    if (!isValidUUID(user.id)) {
      logger.error("Invalid user ID format")
      toast.error("Invalid user session. Please sign in again.")
      return
    }

    try {
      const { results, allSuccess } = await clearUserData(
        supabase,
        user.id,
        ['conversations', 'messages']
      )

      // Log results
      Object.entries(results).forEach(([table, result]) => {
        if (result.error) {
          logRLSError('delete', table, result.error, { userId: user.id })
        } else {
          logger.info(`Cleared ${result.count} rows from ${table}`, { userId: user.id })
        }
      })

      if (!allSuccess) {
        toast.error("Failed to clear some history. Please try again.")
        return
      }

      toast.success("Conversation history cleared")
      setShowClearHistoryDialog(false)
      logger.info("Conversation history cleared", { userId: user.id })
    } catch (error) {
      logger.error("Failed to clear history", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to clear history. Please try again.")
    }
  }

  // ============================================================================
  // Logout
  // ============================================================================

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error("Failed to log out", error)
        toast.error("Failed to log out. Please try again.")
        return
      }

      toast.success("Logged out successfully")
      logger.info("User logged out", { userId: user?.id })
      router.push('/auth/login')
    } catch (error) {
      logger.error("Logout error", error instanceof Error ? error : new Error(String(error)))
      toast.error("An error occurred during logout")
    }
  }

  // ============================================================================
  // Ticker Management
  // ============================================================================

  const addTicker = () => {
    if (!settings || !tickerInput.trim()) return

    const ticker = tickerInput.trim().toUpperCase()
    if (!settings.favorite_tickers.includes(ticker)) {
      updateSetting("favorite_tickers", [...settings.favorite_tickers, ticker])
      setTickerInput("")
    }
  }

  const removeTicker = (ticker: string) => {
    if (!settings) return
    updateSetting(
      "favorite_tickers",
      settings.favorite_tickers.filter((t) => t !== ticker)
    )
  }

  // ============================================================================
  // Loading State
  // ============================================================================

  if (authLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "trading", label: "Trading Preferences", icon: TrendingUp },
    { id: "privacy", label: "Data & Privacy", icon: Shield },
  ]

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="page-container-wide py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/chat">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <LanguageSelector />
              {user ? (
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Link href="/auth/signup">
                    <User className="h-4 w-4 mr-2" />
                    Sign Up to Save
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container-wide py-8 dark:bg-[#0a0a0f]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? "bg-purple-500/15 text-purple-400 dark:bg-purple-500/20 dark:text-purple-300"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
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
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription & Usage</CardTitle>
                        <CardDescription>Manage your plan and monitor credit usage</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Plan Badge */}
                        <div className="space-y-3">
                          <Label>Current Plan</Label>
                          {isFounder ? (
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-orange-500/10 border border-purple-500/20 rounded-lg">
                              <Crown className="w-5 h-5 text-purple-400 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-purple-400">
                                  Founder Account
                                </p>
                                <p className="text-sm text-purple-300/80">
                                  Unlimited Access - Thank you for your support! 🎉
                                </p>
                              </div>
                            </div>
                          ) : credits?.plan && credits.plan !== 'none' ? (
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-blue-600 capitalize">
                                  {credits.plan === 'base' ? 'Base Plan' : `${credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)} Plan`}
                                </p>
                                <p className="text-sm text-blue-700/80">
                                  {credits.monthlyAllocation.toLocaleString()} credits per month
                                </p>
                              </div>
                            </div>
                          ) : credits?.plan === 'none' && (credits.freeQuestionsRemaining ?? 0) > 0 ? (
                            <div className="space-y-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-amber-500">
                                    Free Trial
                                  </p>
                                  <p className="text-sm text-amber-600/80">
                                    {credits.freeQuestionsRemaining} of 10 free questions remaining
                                  </p>
                                </div>
                              </div>
                              <div className="h-2 bg-amber-500/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((10 - credits.freeQuestionsRemaining) / 10) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-amber-600/80">
                                {Math.min(
                                  100,
                                  Math.round(((10 - credits.freeQuestionsRemaining) / 10) * 100)
                                )}% used
                              </p>
                            </div>
                          ) : credits?.plan === 'none' && (credits.freeQuestionsRemaining ?? 0) === 0 ? (
                            <div className="flex items-center gap-3 p-4 bg-muted border border-border rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">
                                  Trial Ended
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Subscribe to continue using Pelican AI
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-4 bg-muted border border-border rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">
                                  No Active Plan
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Subscribe to start using Pelican AI
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Credit Balance */}
                        {!isFounder && isSubscribed && (
                          <>
                            <div className="space-y-3">
                              <Label>Credit Balance</Label>
                              <CreditDisplay variant="detailed" />
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                          {isSubscribed ? (
                            <>
                              <ManageSubscriptionButton className="w-full justify-center" />
                              <Button asChild variant="outline" className="w-full">
                                <Link href="/pricing">
                                  <Zap className="h-4 w-4 mr-2" />
                                  View All Plans
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                              <Link href="/pricing">
                                <Zap className="h-4 w-4 mr-2" />
                                View Plans & Subscribe
                              </Link>
                            </Button>
                          )}
                        </div>

                        {isSubscribed && !isFounder && (
                          <>
                            <Separator />
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-700">
                                <strong>💡 Credits reset monthly.</strong> Unused credits roll over up to 20% of your plan limit.
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Ensure your account stays secure</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current_password">Current Password</Label>
                          <Input
                            id="current_password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm_password">Confirm New Password</Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        <Button onClick={handlePasswordChange} variant="outline">
                          Update Password
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Conversation History</CardTitle>
                        <CardDescription>Manage your conversation data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          onClick={() => setShowClearHistoryDialog(true)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Conversations
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                        <CardDescription>Irreversible actions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Trading Preferences */}
            {activeSection === "trading" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Default Timeframes</CardTitle>
                    <CardDescription>Select your preferred trading timeframes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"].map((tf) => (
                        <div key={tf} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tf-${tf}`}
                            checked={settings.default_timeframes.includes(tf)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateSetting("default_timeframes", [...settings.default_timeframes, tf])
                              } else {
                                updateSetting(
                                  "default_timeframes",
                                  settings.default_timeframes.filter((t) => t !== tf)
                                )
                              }
                            }}
                          />
                          <Label htmlFor={`tf-${tf}`} className="cursor-pointer">
                            {tf}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Markets</CardTitle>
                    <CardDescription>Choose the markets you trade most</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {["stocks", "options", "futures", "crypto"].map((market) => (
                        <div key={market} className="flex items-center space-x-2">
                          <Checkbox
                            id={`market-${market}`}
                            checked={settings.preferred_markets.includes(market)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateSetting("preferred_markets", [...settings.preferred_markets, market])
                              } else {
                                updateSetting(
                                  "preferred_markets",
                                  settings.preferred_markets.filter((m) => m !== market)
                                )
                              }
                            }}
                          />
                          <Label htmlFor={`market-${market}`} className="cursor-pointer capitalize">
                            {market}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Tolerance</CardTitle>
                    <CardDescription>Define your trading risk profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={settings.risk_tolerance}
                      onValueChange={(value) =>
                        updateSetting("risk_tolerance", value as "conservative" | "moderate" | "aggressive")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="conservative" id="conservative" />
                        <Label htmlFor="conservative" className="cursor-pointer">
                          Conservative - Lower risk, steady returns
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moderate" id="moderate" />
                        <Label htmlFor="moderate" className="cursor-pointer">
                          Moderate - Balanced risk and reward
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="aggressive" id="aggressive" />
                        <Label htmlFor="aggressive" className="cursor-pointer">
                          Aggressive - Higher risk, higher potential returns
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Tickers</CardTitle>
                    <CardDescription>Add tickers you frequently trade</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={tickerInput}
                        onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === "Enter" && addTicker()}
                        placeholder="Enter ticker symbol (e.g., AAPL)"
                        maxLength={10}
                      />
                      <Button onClick={addTicker} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.favorite_tickers.map((ticker) => (
                        <div
                          key={ticker}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                        >
                          <span className="font-medium">{ticker}</span>
                          <button
                            onClick={() => removeTicker(ticker)}
                            className="hover:text-purple-900"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Popular tickers:</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_TICKERS.filter((t) => !settings.favorite_tickers.includes(t))
                          .slice(0, 8)
                          .map((ticker) => (
                            <button
                              key={ticker}
                              onClick={() => {
                                updateSetting("favorite_tickers", [...settings.favorite_tickers, ticker])
                              }}
                              className="px-2 py-1 text-sm border border-border rounded hover:bg-muted"
                            >
                              + {ticker}
                            </button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Data & Privacy */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>Manage your data and privacy settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Legal</h4>
                      <div className="space-y-1">
                        <Button variant="link" asChild className="h-auto p-0 text-purple-600">
                          <Link href="/privacy" target="_blank">
                            Privacy Policy
                          </Link>
                        </Button>
                        <br />
                        <Button variant="link" asChild className="h-auto p-0 text-purple-600">
                          <Link href="/terms" target="_blank">
                            Terms of Service
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {user && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-600">Sign Out</CardTitle>
                      <CardDescription>End your session and log out of your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="destructive" 
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our
              servers.
              <div className="mt-4 space-y-2">
                <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE"}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear History Dialog */}
      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your conversations and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
