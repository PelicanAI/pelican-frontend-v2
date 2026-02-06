# V2 Refactor — Task Tracking

## Phase 0: Quick Wins
- [x] Convert pelican-logo-transparent.png to WebP
- [x] Replace all 11 raw <img> tags with next/image
- [x] Remove all ~126 console.log statements (keep console.error and console.warn)
- [x] Remove duplicate Google Fonts <link> tags in app/layout.tsx
- [x] Verify build passes after all changes

## Phase 1: SSR + Performance
- [ ] Convert app/(marketing)/ pages from 'use client' to Server Components
- [ ] Extract interactive elements into small client components
- [ ] Add next/dynamic imports for heavy components
- [ ] Verify no hydration errors
- [ ] Verify SEO meta tags present on all marketing pages
- [ ] Lighthouse performance score 90+
