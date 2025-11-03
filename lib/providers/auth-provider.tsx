"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const migrateGuestConversations = useCallback(async (userId: string) => {
    try {
      const guestConversations = JSON.parse(
        localStorage.getItem('pelican_guest_conversations') || '[]'
      )

      if (guestConversations.length === 0) return

      console.log(`Migrating ${guestConversations.length} guest conversations to user ${userId}`)

      for (const guestConv of guestConversations) {
        try {
          // Create conversation in Supabase
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: userId,
              title: guestConv.title || `Migrated conversation from ${new Date(guestConv.created_at).toLocaleDateString()}`,
              created_at: guestConv.created_at,
              metadata: {
                migrated_from_guest: true,
                original_guest_id: guestConv.id
              }
            })
            .select()
            .single()

          if (convError) {
            console.error('Failed to migrate conversation:', convError)
            continue
          }

          // Get messages for this conversation
          const guestMessages = JSON.parse(
            localStorage.getItem(`pelican_guest_messages_${guestConv.id}`) || '[]'
          )

          if (guestMessages.length > 0) {
            // Prepare messages for insertion
            const messagesToInsert = guestMessages.map((msg: { role: string; content: string; created_at?: string; metadata?: Record<string, unknown> }) => ({
              conversation_id: newConv.id,
              user_id: userId,
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at || new Date().toISOString(),
              metadata: msg.metadata || {}
            }))

            // Insert messages
            const { error: msgError } = await supabase
              .from('messages')
              .insert(messagesToInsert)

            if (msgError) {
              console.error('Failed to migrate messages:', msgError)
            } else {
              console.log(`Migrated ${messagesToInsert.length} messages for conversation ${newConv.id}`)
            }
          }

          // Clear the guest messages from localStorage
          localStorage.removeItem(`pelican_guest_messages_${guestConv.id}`)
        } catch (error) {
          console.error('Migration error:', error)
        }
      }

      // Clear all guest data
      localStorage.removeItem('pelican_guest_conversations')
      localStorage.removeItem('pelican_guest_mode')
      localStorage.removeItem('pelican_guest_user_id')

      console.log('Guest migration completed')
    } catch (error) {
      console.error('Guest migration failed:', error)
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Migrate guest conversations when user logs in
      if (event === 'SIGNED_IN' && session?.user && typeof window !== 'undefined') {
        await migrateGuestConversations(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, migrateGuestConversations])

  const signOut = async () => {
    await supabase.auth.signOut()
    // Clear guest mode if set
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pelican_guest_mode')
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
