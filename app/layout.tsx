import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/lib/providers"
import { Suspense } from "react"
import * as Sentry from '@sentry/nextjs'
import SentryErrorBoundary from "@/components/sentry-error-boundary"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export function generateMetadata(): Metadata {
  return {
    title: "Pelican AI - Elite Trading Assistant",
    description: "AI-powered trading assistant for smarter trading decisions",
    generator: "v0.app",
    other: {
      ...Sentry.getTraceData()
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark:bg-[#0a0a0f]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`font-sans antialiased bg-background dark:bg-[#0a0a0f] ${inter.variable} ${GeistMono.variable}`}>
        <SentryErrorBoundary>
          <Suspense fallback={null}>
            <Providers>
              <>
                {children}
              </>
            </Providers>
          </Suspense>
        </SentryErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
