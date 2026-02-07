"use client"

import type React from "react"

import { AuthProvider } from "./auth-provider"
import { SWRProvider } from "./swr-provider"
import { ToastProvider } from "./toast-provider"
import { TranslationProvider } from "./translation-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { CreditsProvider } from "@/providers/credits-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={true}
      storageKey="pelican-theme"
    >
      <TranslationProvider>
        <SWRProvider>
          <AuthProvider>
            <CreditsProvider>
              <ToastProvider>{children}</ToastProvider>
            </CreditsProvider>
          </AuthProvider>
        </SWRProvider>
      </TranslationProvider>
    </ThemeProvider>
  )
}
