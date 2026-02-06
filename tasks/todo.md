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
