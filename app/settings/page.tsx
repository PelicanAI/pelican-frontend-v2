"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  ArrowLeft,
  User,
  TrendingUp,
  Bell,
  MessageSquare,
  Palette,
  Shield,
  Upload,
  Trash2,
  Download,
  Save,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
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

interface UserSettings {
  // Account
  display_name: string
  email: string
  avatar_url?: string

  // Trading Preferences
  default_timeframes: string[]
  preferred_markets: string[]
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  default_position_size?: number
  favorite_tickers: string[]

  // Notifications
  email_notifications: boolean
  market_alerts: boolean
  price_alerts: boolean
  trade_confirmations: boolean

  // Chat Settings
  auto_scroll: "always" | "when_at_bottom" | "never"
  message_density: "comfortable" | "compact"
  show_timestamps: boolean

  // Display Settings
  theme: "light" | "dark" | "system"
  sidebar_collapsed_default: boolean
  market_panel_visible: boolean
  font_size: "small" | "medium" | "large"
}

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  default_timeframes: ["5m", "15m", "1h"],
  preferred_markets: ["stocks"],
  risk_tolerance: "moderate",
  favorite_tickers: [],
  email_notifications: true,
  market_alerts: true,
  price_alerts: true,
  trade_confirmations: true,
  auto_scroll: "when_at_bottom",
  message_density: "comfortable",
  show_timestamps: true,
  theme: "system",
  sidebar_collapsed_default: false,
  market_panel_visible: true,
  font_size: "medium",
}

const POPULAR_TICKERS = [
  "SPY", "QQQ", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL",
  "META", "AMD", "NFLX", "DIS", "INTC", "BABA", "NIO", "PLTR"
]

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

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
        display_name: user?.user_metadata?.display_name || "",
        email: user?.email || "",
        avatar_url: user?.user_metadata?.avatar_url,
        ...DEFAULT_SETTINGS,
        ...userSettings,
      } as UserSettings)
    } else if (user) {
      setSettings({
        display_name: user.user_metadata?.display_name || "",
        email: user.email || "",
        avatar_url: user.user_metadata?.avatar_url,
        ...DEFAULT_SETTINGS,
      } as UserSettings)
    } else {
      // Guest mode - use default settings
      setSettings({
        display_name: "",
        email: "",
        ...DEFAULT_SETTINGS,
      } as UserSettings)
    }
  }, [userSettings, user])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
      setHasUnsavedChanges(true)
    }
  }

  const handleSave = async () => {
    if (!user || !settings) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

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

  const handlePasswordChange = async () => {
    if (!user) return

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
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

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== "DELETE") return

    try {
      // Delete user data
      await supabase.from("conversations").delete().eq("user_id", user.id)
      await supabase.from("messages").delete().eq("user_id", user.id)
      await supabase.from("user_settings").delete().eq("user_id", user.id)

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error

      toast.success("Account deleted successfully")
      router.push("/")
      logger.info("Account deleted", { userId: user.id })
    } catch (error) {
      logger.error("Failed to delete account", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to delete account. Please contact support.")
    }
  }

  const handleClearHistory = async () => {
    if (!user) return

    try {
      await supabase.from("conversations").delete().eq("user_id", user.id)
      await supabase.from("messages").delete().eq("user_id", user.id)

      toast.success("Conversation history cleared")
      setShowClearHistoryDialog(false)
      logger.info("Conversation history cleared", { userId: user.id })
    } catch (error) {
      logger.error("Failed to clear history", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to clear history. Please try again.")
    }
  }

  const handleExportData = async () => {
    try {
      let exportData: any = {
        settings,
        exported_at: new Date().toISOString(),
      }

      if (user) {
        const { data: conversations } = await supabase
          .from("conversations")
          .select("*, messages(*)")
          .eq("user_id", user.id)

        exportData = {
          ...exportData,
          user: {
            email: user.email,
            created_at: user.created_at,
          },
          conversations,
        }
      } else {
        exportData.note = "Guest mode - only settings exported. Sign in to export conversation history."
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pelican-ai-${user ? 'data' : 'settings'}-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(user ? "Data exported successfully" : "Settings exported successfully")
      logger.info("Data exported", { userId: user?.id || 'guest' })
    } catch (error) {
      logger.error("Failed to export data", error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to export data. Please try again.")
    }
  }

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

  if (authLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "trading", label: "Trading Preferences", icon: TrendingUp },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "chat", label: "Chat Settings", icon: MessageSquare },
    { id: "display", label: "Display", icon: Palette },
    { id: "privacy", label: "Data & Privacy", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/chat">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            {user ? (
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                            Sign in to save your settings
                          </h3>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                            You're currently using Pelican AI in guest mode. Create an account to save your preferences and access additional features.
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
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      {user ? "Update your account details and profile picture" : "View and customize your profile (sign in to save)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={settings.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white text-2xl">
                          {settings.display_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                        <p className="text-sm text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={settings.display_name}
                        onChange={(e) => updateSetting("display_name", e.target.value)}
                        placeholder="Enter your display name"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={settings.email} disabled className="bg-gray-50 dark:bg-gray-900" />
                      <p className="text-sm text-gray-500">Contact support to change your email address</p>
                    </div>
                  </CardContent>
                </Card>

                {user && (
                  <>
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

                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
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
                            className="hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Popular tickers:</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_TICKERS.filter((t) => !settings.favorite_tickers.includes(t))
                          .slice(0, 8)
                          .map((ticker) => (
                            <button
                              key={ticker}
                              onClick={() => {
                                updateSetting("favorite_tickers", [...settings.favorite_tickers, ticker])
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
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

            {/* Notification Settings */}
            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Market Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified of significant market movements</p>
                    </div>
                    <Switch
                      checked={settings.market_alerts}
                      onCheckedChange={(checked) => updateSetting("market_alerts", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Price Alerts</Label>
                      <p className="text-sm text-gray-500">Alerts when your watchlist hits target prices</p>
                    </div>
                    <Switch
                      checked={settings.price_alerts}
                      onCheckedChange={(checked) => updateSetting("price_alerts", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Trade Confirmations</Label>
                      <p className="text-sm text-gray-500">Confirm trade execution notifications</p>
                    </div>
                    <Switch
                      checked={settings.trade_confirmations}
                      onCheckedChange={(checked) => updateSetting("trade_confirmations", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat Settings */}
            {activeSection === "chat" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Behavior</CardTitle>
                    <CardDescription>Customize your chat experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Auto-scroll Behavior</Label>
                      <RadioGroup
                        value={settings.auto_scroll}
                        onValueChange={(value) =>
                          updateSetting("auto_scroll", value as "always" | "when_at_bottom" | "never")
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="always" id="scroll-always" />
                          <Label htmlFor="scroll-always" className="cursor-pointer">
                            Always - Auto-scroll to new messages
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="when_at_bottom" id="scroll-bottom" />
                          <Label htmlFor="scroll-bottom" className="cursor-pointer">
                            When at bottom - Only scroll if already at bottom
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="scroll-never" />
                          <Label htmlFor="scroll-never" className="cursor-pointer">
                            Never - Manual scrolling only
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Message Density</Label>
                        <p className="text-sm text-gray-500">Compact mode shows more messages on screen</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Comfortable</span>
                        <Switch
                          checked={settings.message_density === "compact"}
                          onCheckedChange={(checked) =>
                            updateSetting("message_density", checked ? "compact" : "comfortable")
                          }
                        />
                        <span className="text-sm text-gray-500">Compact</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Timestamps</Label>
                        <p className="text-sm text-gray-500">Display time on each message</p>
                      </div>
                      <Switch
                        checked={settings.show_timestamps}
                        onCheckedChange={(checked) => updateSetting("show_timestamps", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Chat History</CardTitle>
                    <CardDescription>Manage your conversation data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" onClick={() => setShowClearHistoryDialog(true)} className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Conversations
                    </Button>
                    <Button variant="outline" onClick={handleExportData} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Chat History
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Display Settings */}
            {activeSection === "display" && (
              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>Customize the appearance of the app</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Theme</Label>
                    <RadioGroup
                      value={settings.theme}
                      onValueChange={(value) => updateSetting("theme", value as "light" | "dark" | "system")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="cursor-pointer">
                          Light
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="cursor-pointer">
                          Dark
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system" className="cursor-pointer">
                          System (Auto)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-3 block">Font Size</Label>
                    <RadioGroup
                      value={settings.font_size}
                      onValueChange={(value) => updateSetting("font_size", value as "small" | "medium" | "large")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="small" id="font-small" />
                        <Label htmlFor="font-small" className="cursor-pointer text-sm">
                          Small
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="font-medium" />
                        <Label htmlFor="font-medium" className="cursor-pointer">
                          Medium
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="large" id="font-large" />
                        <Label htmlFor="font-large" className="cursor-pointer text-lg">
                          Large
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sidebar Collapsed by Default</Label>
                      <p className="text-sm text-gray-500">Start with sidebar minimized</p>
                    </div>
                    <Switch
                      checked={settings.sidebar_collapsed_default}
                      onCheckedChange={(checked) => updateSetting("sidebar_collapsed_default", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Market Overview Panel Visible</Label>
                      <p className="text-sm text-gray-500">Show market data panel on desktop</p>
                    </div>
                    <Switch
                      checked={settings.market_panel_visible}
                      onCheckedChange={(checked) => updateSetting("market_panel_visible", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data & Privacy */}
            {activeSection === "privacy" && (
              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Legal</h4>
                    <div className="space-y-1">
                      <Button variant="link" asChild className="h-auto p-0 text-purple-600">
                        <Link href="/privacy-policy" target="_blank">
                          Privacy Policy
                        </Link>
                      </Button>
                      <br />
                      <Button variant="link" asChild className="h-auto p-0 text-purple-600">
                        <Link href="/terms-of-service" target="_blank">
                          Terms of Service
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
