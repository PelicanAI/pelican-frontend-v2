# Subscription & Paywall Audit (Frontend Repo)

This document answers the requested questions using only the current frontend repo contents. Where the schema or logic is not present in the repo, it is explicitly noted.

---

## Database & Schema

### `user_credits` table schema
**Not defined in this repo.** There is no SQL schema for `user_credits` in `supabase/*.sql`.

The only documented shape is in `SUBSCRIPTION_GATE_IMPLEMENTATION.md`:
```
user_credits (
  user_id UUID PRIMARY KEY,
  plan_type TEXT,
  is_founder BOOLEAN,
  credits_balance INTEGER,
  -- ... other fields
)
```
This is a partial/expected schema, not an authoritative SQL definition.

**Observed columns in frontend queries:**
- `credits_balance`
- `plan_type`
- `plan_credits_monthly`
- `credits_used_this_month`
- `billing_cycle_start`
- `stripe_customer_id` (used in billing portal lookup)

### Separate subscriptions table?
No subscriptions table schema exists in this repo. There is no SQL defining a `subscriptions` table in `supabase/*.sql`. All subscription state in frontend logic is derived from `user_credits.plan_type`.

### Plan value immediately after signup (before payment)
Frontend behavior suggests one of two states:
1. **`user_credits` row missing** → `use-credits.ts` treats it as `plan: 'none'` and zero credits when Supabase returns `PGRST116`.
2. **Row exists with `plan_type = 'none'`** → `isSubscribed` is false.

`SUBSCRIPTION_GATE_IMPLEMENTATION.md` says new users should have `plan_type = 'none'` created by Stripe webhook or setup.

---

## Stripe Integration

### Webhook handler (full file)
**File:** `app/api/stripe/webhook/route.ts`

**Events handled:**
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

**Behavior by event:**
- **`checkout.session.completed`**
  - Retrieves Stripe subscription object
  - Calls `supabaseAdmin.rpc('setup_subscriber', ...)`
  - Sets `plan_type`, credits, `stripe_customer_id`, `stripe_subscription_id`
  - Uses plan metadata or defaults to `PLAN_CREDITS`

- **`invoice.paid`**
  - On subscription cycle, retrieves subscription
  - Calls `supabaseAdmin.rpc('reset_monthly_credits', p_user_id)`

- **`invoice.payment_failed`**
  - Updates `user_credits.plan_type = 'past_due'`

- **`customer.subscription.deleted`**
  - Calls `supabaseAdmin.rpc('cancel_subscription', p_user_id)`

- **`customer.subscription.updated`**
  - If plan changed, updates `user_credits.plan_type` and `plan_credits_monthly`

### Checkout session behavior
`checkout.session.completed` uses:
```
setup_subscriber(p_user_id, p_plan_type, p_credits, p_stripe_customer_id, p_stripe_subscription_id)
```
So it updates/creates the `user_credits` row via RPC.

### Subscription failure/cancel handlers
Handled as above in `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`.

---

## API Protection

### API routes under `/api`
From `app/api` directory:
- `/api/conversations` (GET/POST)
- `/api/conversations/[id]` (GET/PATCH/DELETE)
- `/api/conversations/[id]/messages` (GET)
- `/api/health` (GET)
- `/api/help-chat` (POST)
- `/api/market-data` (GET)
- `/api/messages/[id]/regenerate` (POST)
- `/api/stripe/billing-portal` (POST)
- `/api/stripe/create-checkout` (POST)
- `/api/stripe/webhook` (POST)
- `/api/upload` (POST)

### `/api/chat`
There is **no** `app/api/chat/route.ts` in this repo. Chat requests appear to be handled elsewhere (streaming to external backend).

### Server-side subscription checks in API routes
No API route in this repo checks `plan_type` / subscription state server-side. Most routes only check authentication with `supabase.auth.getUser()`.

---

## Auth & Session Flow

### `lib/supabase/middleware.ts` (updateSession)
- Creates Supabase server client using request cookies
- Calls `supabase.auth.getUser()`
- If unauthenticated and route is protected (`/profile`, `/chat`, `/settings`), redirects to `/auth/login`
- No subscription checks in middleware

### Signup flow / OAuth
**OAuth callback:** `app/auth/callback/route.ts`
- Exchanges code for session
- Looks up `user_credits.plan_type`
- If plan in `[base, pro, power, founder, starter]` → `/chat`
- Else → `/pricing`
- Does **not** create a `user_credits` row

### `hooks/use-credits.ts`
- Fetches credits with RPC `get_user_credits(p_user_id)`
- Fallback: direct `user_credits` select
- If no row (`PGRST116`), sets `plan: 'none'`, `balance: 0`

---

## Current Leak Path

### User signs up via Google OAuth
1. OAuth completes → `/auth/callback`
2. Callback checks `user_credits.plan_type`
3. If row missing or `plan_type = 'none'`, user is routed to `/pricing`

### User closes pricing page without paying
- No backend update occurs
- `user_credits` remains missing or `plan_type = 'none'`

### User navigates to `/chat`
- `middleware.ts` only checks authentication
- `app/chat/page.tsx` wraps UI in `PaywallGate`, which relies on `useCreditsContext` and `plan_type` logic
- API routes do **not** enforce subscription

**Server-side block for unpaid users?**  
No. There is no subscription validation in API routes or middleware. Only client-side paywall exists.

---

## Edge Cases

### `useCredits` failure
- If credit fetch fails, `error` is set and `loading` eventually false
- `credits` may remain `null`
- `isSubscribed` evaluates to **false** in `providers/credits-provider.tsx` because `credits === null`

### Free trial / freemium
- No `subscription_active` or free-trial logic found in code
- No `free questions` counter found in code
- Only reference is marketing FAQ text (`app/(marketing)/faq/page.tsx`)

---

## Summary

**Subscription is inferred from `user_credits.plan_type`.**  
There is **no** server-side enforcement of subscription in API routes.  
`user_credits` schema is **not** defined in this repo, only described in docs.

---

# Critical Follow-ups (Detailed)

## 1) External Backend (The Real Risk)

### Where does chat actually go?
**Client entrypoints:**
- `hooks/use-chat.ts` → calls `sendStreamingMessage(...)`  
- `hooks/use-message-handler.ts` → calls `sendMessage(...)` from `use-chat`  
- `hooks/use-streaming-chat.ts` → performs the actual network request

**Actual endpoint hit:**
```ts
fetch(`${BACKEND_URL}/api/pelican_stream`, { ... })
```
`BACKEND_URL` is:
```ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev';
```
So **chat goes to an external backend** (not this Next.js repo).

### Is it a separate FastAPI backend?
This repo does **not** contain the backend implementation. It appears to be an external service (`pelican-backend.fly.dev`). The framework (FastAPI or otherwise) is not visible here.

### Does the external backend validate subscription?
**Unknown from this repo.** There is no code here that shows subscription validation in the external backend. The frontend sends a Supabase access token (JWT) in the `Authorization` header, but no subscription check is enforced client-side before sending.

### How does the external backend know who the user is?
`use-streaming-chat.ts` gets the Supabase session token:
```ts
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
...
headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
```
So the backend receives a **JWT in Authorization: Bearer ...**.

---

## 2) Supabase RPC Functions

### `setup_subscriber`
- Invoked in Stripe webhook on `checkout.session.completed`:
```ts
supabaseAdmin.rpc('setup_subscriber', { p_user_id, p_plan_type, p_credits, p_stripe_customer_id, p_stripe_subscription_id })
```
**Definition not in repo.** No SQL for `setup_subscriber` is present in `supabase/*.sql`.

### `cancel_subscription`
- Invoked on `customer.subscription.deleted`:
```ts
supabaseAdmin.rpc('cancel_subscription', { p_user_id })
```
**Definition not in repo.**

### `reset_monthly_credits`
- Invoked on `invoice.paid`:
```ts
supabaseAdmin.rpc('reset_monthly_credits', { p_user_id })
```
**Definition not in repo.**

### `get_user_credits`
- Used in `hooks/use-credits.ts`:
```ts
supabase.rpc('get_user_credits', { p_user_id })
```
**Definition not in repo.**

### Supabase column inspection query
I cannot run queries against your Supabase instance from here.  
Run this in Supabase SQL Editor to get the actual schema:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;
```

---

## 3) The Actual Leak Vector (Client)

### `use-chat.ts` (full file)
See `hooks/use-chat.ts` in this repo (entire file loaded).  
**Key points:**
- Sends streaming requests via `use-streaming-chat`.
- No subscription check before sending messages.
- On backend reject (non-200), it sets error; no subscription gating.

### `use-message-handler.ts` (full file)
See `hooks/use-message-handler.ts` in this repo (entire file loaded).  
**Key points:**
- No subscription check before queueing or sending.
- Relies entirely on upstream gating or backend rejection.

---

## 4) OAuth Callback Gap

**What stops user from typing `/chat` after OAuth?**  
Currently:
- `middleware.ts` checks auth only (session presence).
- `PaywallGate` is client-side.
- No server-side subscription enforcement exists in middleware or API routes.

So a logged-in, unpaid user can still hit `/chat` if client-side gating is bypassed or races.

---

## 5) Backend Repo

No backend repo exists in this workspace.  
If there is a FastAPI (or other) backend, it is **external** and not visible here.
I cannot show its subscription logic without that repo.

---

## Conclusion (Follow-ups 1–4 & 6–7)

- **Chat request is sent to external backend** at `${BACKEND_URL}/api/pelican_stream`.
- The backend is authenticated via **Supabase JWT**.
- **No subscription check** exists in the frontend request path.
- **No server-side subscription check** exists in this repo’s API routes or middleware.
- The **real enforcement must be in the external backend** or in server-side middleware/API that blocks paid operations.
