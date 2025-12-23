# Pelican UI Audit - Complete File Contents

This document contains the full contents of all files needed for UI audit and refactoring to match a polished demo design.

## Component Structure

Based on `find . -name "*.tsx" -path "*/components/*"` output:
- `components/chat/*` - 34 files (main chat components)
- `components/ui/*` - 60 files (shadcn/ui base components)
- Root components: theme-provider, settings-modal, language-selector, etc.

---

## 1. Layout & Structure

### app/layout.tsx
```tsx
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
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable} ${GeistMono.variable}`}>
        <SentryErrorBoundary>
          <Suspense fallback={null}>
            <Providers>{children}</Providers>
          </Suspense>
        </SentryErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
```

### app/page.tsx
```tsx
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/chat")
}
```

**Note:** No separate chat layout file exists. The chat page (`app/chat/page.tsx`) is the main dashboard component.

---

## 2. Sidebar Components

### components/chat/conversation-sidebar.tsx
See full file content in section below (446 lines)

### components/chat/chat-sidebar.tsx
See full file content in section below (139 lines)

---

## 3. Market Overview / Right Panel

### components/chat/trading-context-panel.tsx
See full file content in section below (274 lines)

**Note:** This is the only market overview component. There are no separate watchlist or indices components - they're all within `trading-context-panel.tsx`.

---

## 4. Chat Components

### components/chat/chat-container.tsx
See full file content in section below (506 lines)

### components/chat/chat-input.tsx
See full file content in section below (441 lines)

### components/chat/message-bubble.tsx
See full file content in section below (521 lines)

### components/chat/chat-header.tsx
See full file content in section below (69 lines)

### components/chat/welcome-screen.tsx
See full file content in section below (42 lines)

---

## 5. Styling & Theme

### app/globals.css
See full file content in section below (928 lines)

### app/contrast-fixes.css
```css
/* Force contrast fixes with high specificity */
.pelican-logo-header {
  background-color: #7c3aed !important;
  background: #7c3aed !important;
}

.pelican-logo-header span {
  color: #ffffff !important;
}

.pelican-logo-footer {
  background-color: #7c3aed !important;
  background: #7c3aed !important;
}

.pelican-logo-footer span {
  color: #ffffff !important;
}

.signin-button-custom {
  background-color: #374151 !important;
  background: #374151 !important;
  color: #ffffff !important;
  border: none !important;
}

.signin-button-custom:hover {
  background-color: #4b5563 !important;
  background: #4b5563 !important;
}

/* Override any component library styles */
button.signin-button-custom {
  background-color: #374151 !important;
  color: #ffffff !important;
}

a.signin-button-custom {
  background-color: #374151 !important;
  color: #ffffff !important;
}

/* Adding more specific selectors to override inline styles */
span[style*="backgroundColor: #7c3aed"] {
  background-color: #7c3aed !important;
  background: #7c3aed !important;
  color: #ffffff !important;
}

span[style*='backgroundColor: "#7c3aed"'] {
  background-color: #7c3aed !important;
  background: #7c3aed !important;
  color: #ffffff !important;
}

span[style*="backgroundColor: #374151"] {
  background-color: #374151 !important;
  background: #374151 !important;
  color: #ffffff !important;
}

/* Force purple background on P logo spans */
span.purple-logo {
  background-color: #7c3aed !important;
  color: #ffffff !important;
}

/* Target spans containing "Sign In" */
span.signin-text {
  background-color: #374151 !important;
  color: #ffffff !important;
}

/* Removed the universal span override that was causing text display issues */
/* Removed: body span { color: inherit !important; } */

/* More specific targeting to avoid affecting message content */
.header-area span[style*="color: #ffffff"],
.footer-area span[style*="color: #ffffff"],
.signin-area span[style*="color: #ffffff"] {
  color: #ffffff !important;
}
```

### postcss.config.mjs
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

### components/theme-provider.tsx
```tsx
"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export type { ThemeProviderProps }
```

**Note:** No `tailwind.config.ts` or `tailwind.config.js` file exists. The project uses Tailwind CSS v4 with PostCSS configuration.

### next.config.mjs
```javascript
import {withSentryConfig} from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable linting and type checking during builds for production safety
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Security headers to protect against common attacks
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "pelican-trading-xr",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
```

---

## 6. State & Data Hooks

### hooks/use-conversations.ts
See full file content in section below (544 lines)

### hooks/use-market-data.ts
See full file content in section below (180 lines)

### hooks/use-chat.ts
See full file content in section below (561 lines)

### hooks/use-conversation-router.ts
See full file content in section below (129 lines)

---

## 7. API Routes

### app/api/conversations/route.ts
See full file content in section below (150 lines)

### app/api/conversations/[id]/route.ts
See full file content in section below (307 lines)

### app/api/conversations/[id]/messages/route.ts
See full file content in section below (46 lines)

---

## 8. Types

### lib/chat-utils.ts
```typescript
export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isStreaming?: boolean
  isPinned?: boolean
  isEdited?: boolean
  attachments?: Attachment[] // Added attachments property
  retryAction?: () => void // Added retry action to system messages
}

export interface Attachment {
  type: string
  name: string
  url: string
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: "user",
    content,
    timestamp: new Date(),
  }
}

export function createAssistantMessage(content = ""): Message {
  return {
    id: generateMessageId(),
    role: "assistant",
    content,
    timestamp: new Date(),
    isStreaming: true,
  }
}

export function createSystemMessage(content: string, retryAction?: () => void): Message {
  return {
    id: generateMessageId(),
    role: "system",
    content,
    timestamp: new Date(),
    retryAction,
  }
}

/**
 * Process Pelican API response to handle both old format (plain text) and new format (object with attachments)
 */
export interface ProcessedResponse {
  text: string
  attachments: Attachment[]
  hasAttachments: boolean
}

export function processPelicanResponse(response: unknown): ProcessedResponse {
  // Check if response is an object with content and potential attachments
  if (typeof response === "object" && response !== null && "content" in response) {
    // New format with potential attachments
    const obj = response as { content?: string; attachments?: Attachment[] }
    return {
      text: obj.content || "",
      attachments: obj.attachments || [],
      hasAttachments: Array.isArray(obj.attachments) && obj.attachments.length > 0,
    }
  } else if (typeof response === "string") {
    // Old format - plain text
    return {
      text: response,
      attachments: [],
      hasAttachments: false,
    }
  } else {
    // Fallback for unexpected formats
    return {
      text: String(response || ""),
      attachments: [],
      hasAttachments: false,
    }
  }
}
```

### types/translations.ts
See full file content in section below (144 lines)

**Note:** Market types are defined inline in `components/chat/trading-context-panel.tsx` and `hooks/use-market-data.ts`:

```typescript
// From trading-context-panel.tsx and use-market-data.ts
interface MarketIndex {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
}

interface SectorData {
  name: string
  changePercent: number | null
}

interface WatchlistTicker {
  symbol: string
  price: number | null
  changePercent: number | null
}
```

---

## FULL FILE CONTENTS

The following sections contain the complete, unedited contents of the key files.

