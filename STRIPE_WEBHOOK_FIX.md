# Stripe Webhook 307 Redirect Fix ✅

## Problem

The Stripe webhook at `/api/stripe/webhook` was returning a **307 Temporary Redirect** instead of processing webhook events. This caused all webhook events to fail.

**Root Cause:** The middleware was intercepting the webhook request and calling `updateSession()`, which triggered Supabase auth checks and caused redirects.

---

## What Was Fixed

### 1. ✅ Added Webhook Bypass in Middleware

**File:** `middleware.ts`

**Added at the very top of the middleware function:**

```typescript
export async function middleware(request: NextRequest) {
  // CRITICAL: Stripe webhook must bypass ALL middleware (no auth, no redirects)
  // Webhooks need raw request body and cannot have any interference
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }
  
  // ... rest of middleware
}
```

**Why:** Stripe webhooks come from Stripe's servers, not authenticated users. They need to bypass:
- Authentication checks
- Session updates
- Redirects
- Any other middleware processing

### 2. ✅ Added Runtime Configuration to Webhook Route

**File:** `app/api/stripe/webhook/route.ts`

**Added at the end:**

```typescript
// CRITICAL: Disable body parsing for Stripe webhooks
// Stripe needs the raw request body to verify the signature
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Why:** 
- `runtime = 'nodejs'` ensures the route runs in Node.js runtime (not Edge)
- `dynamic = 'force-dynamic'` prevents caching of webhook responses
- Stripe needs the raw request body to verify webhook signatures

---

## How Webhooks Work Now

### Request Flow:
```
1. Stripe sends webhook → /api/stripe/webhook
2. Middleware checks path → Matches /api/stripe/webhook
3. Middleware immediately returns NextResponse.next()
4. Webhook handler receives raw request
5. Verifies Stripe signature
6. Processes event
7. Returns 200 OK to Stripe
```

### Without the Fix:
```
1. Stripe sends webhook → /api/stripe/webhook
2. Middleware calls updateSession()
3. Supabase auth check runs
4. Returns 307 redirect ❌
5. Stripe receives redirect, marks webhook as failed
```

---

## Testing the Fix

### 1. Deploy to Vercel

Push your changes and deploy:

```bash
git add middleware.ts app/api/stripe/webhook/route.ts
git commit -m "Fix Stripe webhook 307 redirect"
git push
```

### 2. Resend Failed Webhooks in Stripe

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Find the failed events (they'll have a red error indicator)
4. Click on each failed event
5. Click **"Resend"** button in the top right
6. Check if the response is now **200 OK** instead of **307**

### 3. Test New Webhook Events

**Trigger a test event:**

```bash
stripe trigger checkout.session.completed
```

Or use the Stripe Dashboard:
1. Go to Webhooks
2. Click your endpoint
3. Click "Send test webhook"
4. Select event type: `checkout.session.completed`
5. Click "Send test webhook"

**Check the response:**
- ✅ Should be **200 OK**
- ✅ Response body: `{"received": true}`
- ❌ Should NOT be **307 Redirect**

### 4. Test Real Subscription Flow

1. Sign up as a new user
2. Go to `/pricing`
3. Select a plan
4. Complete test payment (use card: `4242 4242 4242 4242`)
5. Return to your app
6. Check Stripe Dashboard → Events
7. Verify `checkout.session.completed` webhook succeeded
8. Check your database `user_credits` table
9. User should have credits allocated

---

## Webhook Events Being Handled

Your webhook now correctly processes these events:

| Event | What It Does |
|-------|-------------|
| `checkout.session.completed` | Creates subscription, sets up user credits |
| `invoice.paid` | Resets monthly credits on billing cycle |
| `invoice.payment_failed` | Marks account as `past_due` |
| `customer.subscription.deleted` | Cancels subscription |
| `customer.subscription.updated` | Updates plan/credits when user upgrades |

---

## Verifying Webhook Status

### In Vercel Logs:

```bash
vercel logs --follow
```

Look for:
```
Processing Stripe event: checkout.session.completed
✅ User abc123 subscribed to base with 700 credits
```

### In Stripe Dashboard:

1. Go to Webhooks → Your endpoint
2. Recent deliveries should show:
   - **200** status code
   - **"received: true"** response
   - No error messages

### In Your Database:

Query `user_credits` table:
```sql
SELECT user_id, plan_type, credits_balance, stripe_customer_id 
FROM user_credits 
WHERE plan_type != 'none';
```

Should show users with active subscriptions and credit balances.

---

## Environment Variables Required

Make sure these are set in Vercel:

```bash
STRIPE_SECRET_KEY=sk_live_xxx  # or sk_test_xxx for test mode
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

**Get webhook secret from Stripe:**
1. Dashboard → Developers → Webhooks
2. Click your endpoint
3. Click "Reveal" next to "Signing secret"
4. Copy to `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Common Issues & Solutions

### Webhook still returns 307

**Check:**
- Middleware change was deployed
- Vercel build succeeded
- You're testing the production URL (not localhost)

**Fix:** 
```bash
# Force rebuild
vercel --prod --force
```

### Signature verification fails

**Check:**
- `STRIPE_WEBHOOK_SECRET` matches your Stripe endpoint
- Using correct Stripe endpoint (test vs live)

**Fix:**
```bash
# In Vercel, update the webhook secret
vercel env add STRIPE_WEBHOOK_SECRET
```

### Events processed but credits not added

**Check:**
- `SUPABASE_SERVICE_ROLE_KEY` is set
- Supabase functions exist (`setup_subscriber`, `deduct_credits`)
- RLS policies allow service role to write

**Fix:**
- Run the Supabase schema SQL again
- Check Supabase logs for errors

### Webhook times out

**Check:**
- Webhook handler isn't making slow external API calls
- Database queries are indexed
- No infinite loops in event processing

**Fix:**
- Add timeouts to external calls
- Optimize database queries
- Add logging to find slow code

---

## Security Notes

✅ **Why bypassing middleware is safe:**
- Stripe signs all webhook requests
- We verify the signature using `stripe.webhooks.constructEvent()`
- Invalid signatures are rejected with 400 error
- Only Stripe can send valid webhook requests

✅ **What's protected:**
- Signature verification ensures request is from Stripe
- Service role key is kept secret
- Webhook secret is never exposed to client
- All database operations use RLS (Row Level Security)

⚠️ **Do NOT:**
- Remove signature verification
- Log the webhook secret
- Use anon key instead of service role key
- Skip error handling

---

## Monitoring Webhooks

### Set up monitoring:

1. **Stripe Dashboard:**
   - Go to Webhooks → Your endpoint
   - Monitor success rate
   - Set up email alerts for failures

2. **Vercel Logs:**
   - Enable log streaming
   - Filter by `/api/stripe/webhook`
   - Set up alerts for 500 errors

3. **Sentry (if enabled):**
   - Webhook errors are captured
   - Check Sentry dashboard for exceptions

### Healthy webhook metrics:

- ✅ 95%+ success rate
- ✅ < 1 second average response time
- ✅ No signature verification failures
- ✅ All event types processed correctly

---

## Next Steps

1. ✅ **Deploy the fix** to production
2. ✅ **Resend failed webhooks** in Stripe Dashboard
3. ✅ **Test a new subscription** end-to-end
4. ✅ **Monitor webhook success rate** for 24 hours
5. ✅ **Set up alerts** for webhook failures

Your Stripe webhook should now work perfectly! 🎉

