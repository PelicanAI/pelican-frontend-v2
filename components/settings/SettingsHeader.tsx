"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { LanguageSelector } from "@/components/language-selector"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface SettingsHeaderProps {
  user: SupabaseUser | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  onSave: () => void
}

export function SettingsHeader({ user, isSaving, hasUnsavedChanges, onSave }: SettingsHeaderProps) {
  return (
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
                onClick={onSave}
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
  )
}
