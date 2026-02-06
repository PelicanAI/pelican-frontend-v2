# V2 Refactor — Task Tracking

## Phase 0: Quick Wins
- [x] Convert pelican-logo-transparent.png to WebP
- [x] Replace all 11 raw <img> tags with next/image
- [x] Remove all ~126 console.log statements (keep console.error and console.warn)
- [x] Remove duplicate Google Fonts <link> tags in app/layout.tsx
- [x] Verify build passes after all changes

## Phase 1: SSR + Performance
- [x] Convert app/(marketing)/ pages from 'use client' to Server Components
- [x] Extract interactive elements into small client components
- [x] Add next/dynamic imports for heavy components (HelpChat ssr:false, DemoCard with loading skeleton)
- [x] Verify no hydration errors (PASS — no hooks/event handlers in Server Component pages)
- [x] Verify SEO meta tags present on all marketing pages (per-page metadata + og:image added)
- [ ] Lighthouse performance score 90+ (not tested — requires browser)

## Phase 2: Component Splitting
- [x] Split app/settings/page.tsx into section components (7 sub-components in components/settings/, 20 tests passing)
- [x] Split components/chat/message-bubble.tsx into sub-components (5 sub-components in components/chat/message/, 28 tests passing)
- [x] Split components/chat/chat-input.tsx into sub-components (6 sub-components in components/chat/input/, 21 tests passing)

## Performance Audit Cleanup
- [x] Remove unused dependencies (recharts, dompurify, 4 Radix packages) + switch dompurify→isomorphic-dompurify
- [x] Delete 10 unused UI component files (chart, carousel, calendar, drawer, command, resizable, accordion, collapsible, context-menu, navigation-menu)
- [x] Switch 7 PNG logo references to WebP + convert raw <img> to next/image in data-table.tsx
- [x] Remove debug console.log from use-chat.ts and use-streaming-chat.ts
- [x] Add display: "swap" to all 3 font declarations in marketing layout
- [x] Add priority prop to chat header logo
- [x] Fix SWR global fetcher error handling
- [x] Add loading.tsx skeletons for settings, pricing, profile
- [x] Convert pricing page to Server Component (extracted PricingPageContent client component)
- [x] Remove 'use client' from stateless UI components (no-op — all already server-compatible)

## Phase 3: Chat Features
- [x] Regenerate Response Button — already implemented; threaded `isRegenerating` prop through chat-container → streaming-message → message-bubble (was hardcoded `false`)
- [x] Suggested Prompts — created SuggestedPrompts.tsx (6 stock-related prompts, 2/3 col grid, framer-motion stagger), integrated into welcome-screen.tsx, added 4 tests
- [x] Mobile Chat UI Polish — fixed touch targets in message-actions.tsx (h-11/sm:h-7 + 44px min), added overflow-hidden to message-bubble containers

## Phase 4: Admin Dashboard
- [x] Add `is_admin` column to profiles table (backend — migration via Supabase)
- [x] Create admin RLS policies (backend — service role bypass for admin aggregate queries)
- [x] Create admin API routes — GET /api/admin/stats, GET /api/admin/users (backend)
- [x] Add admin middleware/route protection — `requireAdmin()` for API, `requireAdminPage()` for layouts, `/admin` in middleware protected routes (backend)
- [x] Build admin layout with sidebar nav — `app/admin/layout.tsx` Server Component with auth check, `AdminSidebar` client component with Dashboard/Users/Analytics nav
- [x] Build admin dashboard page with stats cards — Total Users, Active Today, Total Conversations, Credits Used; Recent Signups and Recent Conversations lists
- [x] Build admin users page with searchable table — paginated UsersTable with search, expandable UserDetail rows, plan/credits display
- [x] Build admin analytics page with charts — CSS bar charts for conversations/signups per day (last 30 days), plan distribution progress bars
- [x] Update tasks/todo.md and tasks/lessons.md, verify build + tests pass (73 tests passing, build passes except pre-existing Stripe env var issue)

## Phase 5: TradingView Charts
- [x] ChartProvider context — `providers/chart-provider.tsx` with `showChart(ticker)` / `closeChart()` + safe `useChart()` hook (no-op outside provider)
- [x] TradingView chart component — `components/chat/TradingViewChart.tsx` with Advanced Chart widget embed, dark theme, candle style, back button header
- [x] Right panel mode switching — `trading-context-panel.tsx` renders chart when `mode === 'chart'`, market overview when `mode === 'overview'`
- [x] Clickable tickers in messages — `extractTradingMetadata()` extracts tickers at render time, `applyTickerLinks()` wraps them in purple clickable spans, click delegation via `useChart().showChart()`
- [x] Watchlist clickable tickers — `onClick={() => showChart(ticker.symbol)}` on watchlist items
- [x] Mobile chart sheet — `MobileChartSheet` component with bottom Sheet (70vh) for viewports below xl
- [x] Auto-expand trading panel — `ChartPanelExpander` component expands collapsed panel when chart requested
- [x] Verify: 73 tests passing, no new ESLint errors, build passes (pre-existing Stripe issue only)

## Phase 6: Bugs, Performance, Polish

### Group A: Data Layer Fixes
- [x] A1. Fix conversations pagination (limit 1000 → 20 + loadMore)
- [x] A2. Add Cache-Control headers to all API routes
- [x] A3. Fix market data over-fetching (revalidate 0 → 60s cache)
- [x] A4. Remove in-memory rate limiting (useless in serverless)
- [x] Group A: build + test verification + commit

### Group B: Code Splitting & Performance
- [x] B1. Dynamic imports for modals + TradingView in chat page
- [x] B2. React.memo for ConversationItem
- [x] B3. Review 'use client' directives (all legitimate — no changes needed)
- [x] Group B+C: build + test verification + commit

### Group C: Code Quality
- [x] C1. Console.log cleanup (already done in prior phases — verified)
- [x] C2. Extract nested ConversationItem from sidebar
- [x] C3. Stripe env var guard (already handled — verified)

### Group D: Infrastructure
- [x] D1. Remove external API call from middleware (combined with A4)
- [x] D2. Add error boundaries for admin + pricing
- [x] D3. Configure Vercel function timeouts for API routes
- [x] Group D: build + test verification + commit
