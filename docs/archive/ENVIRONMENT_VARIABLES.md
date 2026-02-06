# Environment Variables for Credits System

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# ============================================
# Stripe Configuration (Credits System)
# ============================================

# Your Stripe secret key (starts with sk_test_ for test mode)
STRIPE_SECRET_KEY=sk_test_xxxxx

# Webhook signing secret (starts with whsec_)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs for each plan (starts with price_)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_POWER_PRICE_ID=price_xxxxx

# ============================================
# App Configuration
# ============================================

# Base URL of your app (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# Optional: Backend API
# ============================================

# If your backend is separate from Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Where to Find These Values

### Supabase Variables

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

### Stripe Variables

#### Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy the **Secret key** (starts with `sk_test_`)
3. Add to `STRIPE_SECRET_KEY`

#### Price IDs

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Create three products:
   - **Pelican Starter**: $29/month → Copy Price ID
   - **Pelican Pro**: $99/month → Copy Price ID
   - **Pelican Power**: $249/month → Copy Price ID
3. Add each Price ID to the corresponding env variable

#### Webhook Secret

**For Local Development:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret. Copy it to `STRIPE_WEBHOOK_SECRET`.

**For Production:**

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### App URL

- **Local**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

This is used for Stripe checkout redirects.

## Security Notes

- ⚠️ **Never commit `.env.local` to Git**
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - keep it secret
- ⚠️ `STRIPE_SECRET_KEY` can charge customers - never expose it
- ✅ Variables starting with `NEXT_PUBLIC_` are safe to expose to the browser

## Vercel Deployment

When deploying to Vercel, add these environment variables in:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable with its production value
3. Make sure to select the correct environment (Production, Preview, Development)

