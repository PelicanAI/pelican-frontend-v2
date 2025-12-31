# Credits System - Quick Reference

## 🚀 Quick Start Checklist

- [x] ✅ All files installed
- [x] ✅ CreditsProvider integrated into app
- [x] ✅ Stripe package installed
- [ ] 🔧 Add environment variables to `.env.local`
- [ ] 🔧 Set up Stripe products and prices
- [ ] 🔧 Configure Stripe webhook
- [ ] 🔧 Run Supabase schema SQL
- [ ] 🔧 Add CreditDisplay to your UI
- [ ] 🔧 Update chat page with credit-aware logic

See `CREDITS_SYSTEM_SETUP.md` for detailed instructions.

---

## 📦 What's Included

### Hooks
```tsx
import { useCredits } from '@/hooks/use-credits'
import { useCreditAwareChat } from '@/hooks/use-credit-aware-chat'
```

### Provider
```tsx
import { CreditsProvider, useCreditsContext } from '@/providers/credits-provider'
```

### Components
```tsx
import { CreditDisplay } from '@/components/credit-display'
import { UpgradeModal } from '@/components/upgrade-modal'
import { CreditCostBadge, QUERY_COSTS } from '@/components/credit-cost-badge'
import { PaywallGate, useSubscriptionRequired } from '@/components/paywall-gate'
import { SubscriptionWelcomeBanner } from '@/components/subscription-welcome-banner'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'
```

---

## 💻 Common Usage Patterns

### Display Credit Balance

```tsx
// Compact (header)
<CreditDisplay variant="compact" />

// Default (with link)
<CreditDisplay />

// Detailed (sidebar)
<CreditDisplay variant="detailed" />
```

### Check Subscription Status

```tsx
const { isSubscribed, isFounder, credits } = useCreditsContext()

if (!isSubscribed) {
  return <PaywallGate />
}
```

### Handle Chat Response

```tsx
const { 
  checkResponse, 
  handleResponse, 
  showUpgradeModal,
  creditError,
  closeUpgradeModal 
} = useCreditAwareChat()

const response = await fetch('/api/chat', { ... })

// Check for 402 error
if (await checkResponse(response)) return

const data = await response.json()

// Update balance from response
handleResponse(data)

// Show modal if needed
<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={closeUpgradeModal}
  required={creditError?.required || 0}
  balance={creditError?.balance || 0}
/>
```

### Protect Routes

```tsx
export default function ProtectedPage() {
  return (
    <PaywallGate>
      {/* Your protected content */}
    </PaywallGate>
  )
}
```

### Show Cost Badge

```tsx
import { CreditCostBadge } from '@/components/credit-cost-badge'

<CreditCostBadge cost={25} />
// Displays: "⚡ -25 credits"
```

### Manage Subscription Button

```tsx
<ManageSubscriptionButton variant="link" />
// or
<ManageSubscriptionButton /> // default button style
```

---

## 🎨 Credit Cost Reference

```typescript
export const QUERY_COSTS = {
  conversation: { label: 'Chat', cost: 2 },
  simple: { label: 'Price Check', cost: 10 },
  basic: { label: 'Technical Analysis', cost: 25 },
  event_study: { label: 'Event Study', cost: 75 },
  multi_day_tick: { label: 'Deep Analysis', cost: 250 },
}
```

---

## 🔌 API Endpoints

### Create Checkout Session
`POST /api/stripe/create-checkout`

```json
{
  "priceId": "price_xxxxx",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "planName": "starter",
  "planCredits": 700
}
```

### Billing Portal
`POST /api/stripe/billing-portal`

Returns a URL to Stripe's customer portal for managing subscriptions.

### Webhook
`POST /api/stripe/webhook`

Handles Stripe events:
- `checkout.session.completed` - New subscription
- `invoice.paid` - Monthly billing
- `invoice.payment_failed` - Payment failure
- `customer.subscription.deleted` - Cancellation
- `customer.subscription.updated` - Plan change

---

## 🎯 Plan Tiers

| Plan | Price | Credits | Use Case |
|------|-------|---------|----------|
| Starter | $29/mo | 700 | ~70 price checks, ~28 analyses |
| Pro | $99/mo | 2,800 | ~280 price checks, ~112 analyses |
| Power | $249/mo | 8,300 | ~830 price checks, ~332 analyses |
| Founder | - | Unlimited | Special access |

---

## 🔐 Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_POWER_PRICE_ID=price_xxxxx

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `ENVIRONMENT_VARIABLES.md` for more details.

---

## 🧪 Testing

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Local Webhook Testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 📝 Backend Contract

Your backend should:

1. **Deduct credits before processing**
   ```sql
   SELECT * FROM deduct_credits('user-id', 25);
   ```

2. **Return credit info on success**
   ```json
   {
     "answer": "...",
     "credits_used": 25,
     "credits_remaining": 675
   }
   ```

3. **Return 402 on insufficient credits**
   ```json
   {
     "error": "insufficient_credits",
     "required": 25,
     "balance": 5,
     "message": "You need 25 credits but only have 5"
   }
   ```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Stripe is not defined" | Run `npm install stripe` |
| Webhook 401 errors | Check `STRIPE_WEBHOOK_SECRET` is correct |
| Credits not updating | Ensure backend returns `credits_remaining` |
| Provider error | Make sure CreditsProvider is in provider tree |
| Balance not showing | Check Supabase `user_credits` table exists |

---

## 📚 Full Documentation

- `CREDITS_SYSTEM_SETUP.md` - Complete setup guide
- `ENVIRONMENT_VARIABLES.md` - Environment variable reference
- Backend's `BACKEND_CONTRACT.md` - API specification

