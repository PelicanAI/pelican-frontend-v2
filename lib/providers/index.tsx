"use client"

import type React from "react"

import { AuthProvider } from "./auth-provider"
import { SWRProvider } from "./swr-provider"
import { ToastProvider } from "./toast-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="pelican-theme"
    >
      <SWRProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </SWRProvider>
    </ThemeProvider>
  )
}
