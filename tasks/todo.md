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
