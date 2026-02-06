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
    metadataBase: new URL('https://pelicantrading.ai'),
    title: {
      default: 'Pelican Trading | AI Market Intelligence for Traders',
      template: '%s | Pelican Trading',
    },
    description: "AI-powered trading assistant for smarter trading decisions. Real-time market analysis, backtesting, and institutional-grade intelligence.",
    openGraph: {
      title: 'Pelican Trading | AI Market Intelligence for Traders',
      description: 'AI-powered trading assistant for smarter trading decisions.',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Pelican Trading' }],
      type: 'website',
      siteName: 'Pelican Trading',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pelican Trading | AI Market Intelligence for Traders',
      description: 'AI-powered trading assistant for smarter trading decisions.',
      images: ['/og-image.png'],
    },
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
      <head />
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
