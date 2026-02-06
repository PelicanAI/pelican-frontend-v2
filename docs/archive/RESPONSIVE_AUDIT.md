# Responsive Audit

## Breakpoints Used
- xs: <640px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px
- 3xl: 1920px
- 4xl: 2560px

## Pages / Components Touched
- `app/globals.css` (responsive primitives, overflow safeguards, typography scaling)
- `app/layout.tsx` (dev-only breakpoint badge)
- Marketing
  - `app/(marketing)/page.tsx` (mobile nav)
  - `app/(marketing)/faq/page.tsx` (mobile nav)
  - `app/(marketing)/styles/marketing.css` (systemic spacing, nav, grids)
  - `app/(marketing)/styles/faq.css`
  - `app/(marketing)/styles/privacy.css`
  - `app/(marketing)/styles/terms.css`
- App shell / content
  - `app/chat/page.tsx` (safe-area, padding, mobile nav controls)
  - `components/chat/data-visualizations/data-table.tsx` (responsive table + watermark)
  - `app/settings/page.tsx` (container + tap targets)
  - `app/profile/page.tsx` (responsive header layout)
  - `app/pricing/page.tsx` (container + heading scale)
- Dev tooling / tests
  - `components/dev/breakpoint-badge.tsx`
  - `playwright.config.ts`
  - `tests/responsive.spec.ts`

## Key Issues Found + Fixes
- Fixed-width paddings and max-widths across marketing and legal pages → moved to responsive gutters/section spacing.
- Navigation not usable on small screens (marketing + FAQ) → added mobile nav toggle and menu.
- Chat layout and composer spacing on mobile → added safe-area padding and consistent content gutters.
- Data tables could overflow on small screens → ensured internal x-scroll and scaled table/watermark.
- Consistency across app pages → standardized containers, section padding, and tap targets.

## Remaining Known Issues
- Authenticated routes that require login (`/profile`, `/chat`) will redirect to login during automated tests without seeded auth.
- If future marketing pages add new fixed-width elements, they should adopt `page-container` + `page-section` utilities.

