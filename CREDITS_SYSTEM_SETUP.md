# Pelican Credits System - Setup Complete ✅

## What Was Installed

The Pelican Credits System has been successfully installed in your frontend. Here's what was added:

### 📁 New Files Created

#### Hooks
- `hooks/use-credits.ts` - Fetches and manages credit balance from Supabase
- `hooks/use-credit-aware-chat.ts` - Handles 402 responses and credit updates

#### Providers
- `providers/credits-provider.tsx` - App-wide credit state management

#### Components
- `components/credit-display.tsx` - Shows credit balance (3 variants: default, compact, detailed)
- `components/upgrade-modal.tsx` - "Not enough credits" modal
- `components/credit-cost-badge.tsx` - Shows credit costs on messages
- `components/paywall-gate.tsx` - Blocks content for non-subscribers
- `components/subscription-welcome-banner.tsx` - Success message after payment
- `components/manage-subscription-button.tsx` - Opens Stripe billing portal

#### Pages & API Routes
- `app/pricing/page.tsx` - Pricing page with plan selection
- `app/api/stripe/create-checkout/route.ts` - Creates Stripe checkout sessions
- `app/api/stripe/webhook/route.ts` - Handles Stripe subscription events
- `app/api/stripe/billing-portal/route.ts` - Opens subscription management

### 🔌 Integration Complete

The `CreditsProvider` has been added to your app's provider tree in `lib/providers/index.tsx`. It wraps your entire app and provides credit information to all components.

---

## 🚀 Next Steps - Required Setup

### 1. Install Stripe Package

Run this command in your terminal:

```bash
npm install stripe
```

### 2. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_POWER_PRICE_ID=price_xxxxx

# Supabase Service Role (for webhook server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Stripe

#### Create Products & Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create three products:

   **Product 1: Pelican Starter**
   - Price: $29/month
   - Recurring billing
   - Copy the Price ID → Add to `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`

   **Product 2: Pelican Pro**
   - Price: $99/month
   - Recurring billing
   - Copy the Price ID → Add to `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

   **Product 3: Pelican Power**
   - Price: $249/month
   - Recurring billing
   - Copy the Price ID → Add to `NEXT_PUBLIC_STRIPE_POWER_PRICE_ID`

#### Configure Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing: Use `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** → Add to `STRIPE_WEBHOOK_SECRET`

### 4. Run Supabase Schema

You need to run the SQL schema that creates the `user_credits` table and database functions.

Look for a file named `supabase-schema.sql` or similar in your project. Run it in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Paste the schema SQL
3. Run the query

The schema should include:
- `user_credits` table
- `get_user_credits` function
- `deduct_credits` function
- `setup_subscriber` function
- `cancel_subscription` function
- `reset_monthly_credits` function

---

## 🎨 Add Credit Display to Your UI

### Option 1: Add to Header (Recommended)

Find your header component and add:

```tsx
import { CreditDisplay } from '@/components/credit-display'

// In your header JSX:
<CreditDisplay />
```

### Option 2: Add to Sidebar (Detailed View)

```tsx
import { CreditDisplay } from '@/components/credit-display'

// In your sidebar JSX:
<CreditDisplay variant="detailed" />
```

### Option 3: Compact View (Minimal Space)

```tsx
<CreditDisplay variant="compact" />
```

---

## 💬 Integrate into Chat Page

Update your chat page to handle credit-aware responses:

```tsx
import { useCreditAwareChat } from '@/hooks/use-credit-aware-chat'
import { UpgradeModal } from '@/components/upgrade-modal'
import { SubscriptionWelcomeBanner } from '@/components/subscription-welcome-banner'

export default function ChatPage() {
  const { 
    showUpgradeModal, 
    creditError, 
    closeUpgradeModal,
    checkResponse,
    handleResponse 
  } = useCreditAwareChat()

  const handleSendMessage = async (message: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })

    // Check for 402 Insufficient Credits
    if (await checkResponse(response)) return

    const data = await response.json()
    
    // Update credit balance from response
    handleResponse(data)
    
    // Continue with your chat logic...
  }

  return (
    <div>
      <SubscriptionWelcomeBanner />
      
      {/* Your chat UI */}
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeUpgradeModal}
        required={creditError?.required || 0}
        balance={creditError?.balance || 0}
      />
    </div>
  )
}
```

---

## 🔧 Testing Locally

### 1. Start Stripe Webhook Listener

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret it provides and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 2. Use Test Cards

Stripe provides test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Use any future expiry date and any CVC.

### 3. Test the Flow

1. Go to `http://localhost:3000/pricing`
2. Click "Get Started" on any plan
3. Use test card to complete payment
4. You should be redirected to `/chat?subscribed=true&plan=starter`
5. Welcome banner should appear
6. Credit balance should be visible

---

## 📋 Backend Requirements

Your backend needs to:

### 1. Return Credit Info in Successful Responses

```json
{
  "answer": "...",
  "credits_used": 10,
  "credits_remaining": 690
}
```

### 2. Return 402 for Insufficient Credits

```json
// Status: 402 Payment Required
{
  "error": "insufficient_credits",
  "required": 25,
  "balance": 5,
  "message": "You need 25 credits but only have 5"
}
```

### 3. Deduct Credits Before Processing

Use the Supabase function:

```sql
SELECT * FROM deduct_credits(
  p_user_id := 'user-uuid',
  p_amount := 25
);
```

This returns `{success: true}` or `{success: false, error: "insufficient_credits"}`

---

## 🎉 You're All Set!

Once you complete the setup steps above, your credits system will be fully operational:

- ✅ Users can subscribe via `/pricing`
- ✅ Credit balance displays throughout the app
- ✅ Chat requests deduct credits
- ✅ 402 responses show upgrade modal
- ✅ Stripe handles billing automatically
- ✅ Credits reset monthly via webhooks

---

## 🆘 Need Help?

Common issues:

1. **"Stripe is not defined"** → Run `npm install stripe`
2. **Webhook 401 errors** → Check `STRIPE_WEBHOOK_SECRET` matches your endpoint
3. **Credits not updating** → Ensure backend returns `credits_remaining` in responses
4. **Provider error** → Make sure you ran `npm install` after adding new files

For more help, check your backend's `BACKEND_CONTRACT.md` for the full API specification.

