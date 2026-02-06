"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
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
import {
  clearUserData,
  isValidUUID,
  logRLSError
} from "@/lib/supabase/helpers"
import type { User as SupabaseUser, SupabaseClient } from "@supabase/supabase-js"

interface SecuritySectionProps {
  user: SupabaseUser
  supabase: SupabaseClient
}

export function SecuritySection({ user, supabase }: SecuritySectionProps) {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false)

  const handlePasswordChange = async () => {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return

    if (!isValidUUID(user.id)) {
      logger.error("Invalid user ID format")
      toast.error("Invalid user session. Please sign in again.")
      return
    }

    try {
      const { results, allSuccess } = await clearUserData(
        supabase,
        user.id,
        ['conversations', 'messages', 'user_settings']
      )

      Object.entries(results).forEach(([table, result]) => {
        if (result.error) {
          logRLSError('delete', table, result.error, { userId: user.id })
        } else {
          logger.info(`Deleted ${result.count} rows from ${table}`, { userId: user.id })
        }
      })

      if (!allSuccess) {
        logger.warn("Some data deletion failed", { results })
      }

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

  const handleClearHistory = async () => {
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

  return (
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
    </>
  )
}
