

## Plan: Add Free Trial with Stripe `trial_period_days` and Subscription Status Check

### Context
- No `has_active_subscription` function or `check-subscription` edge function exists yet
- The existing `create-checkout-session` function is tied to service submissions (requires `submissionId`)
- Need a separate checkout flow for the "1 Month Free" trial that is independent of service submissions

### Architecture

```text
User visits Services tab
  ├─ check-subscription edge function → queries Stripe for active/trialing subs
  │   ├─ Has active/trialing sub → Show "Premium Member" or "Trial Active (X days left)"
  │   └─ No sub → Show "Start 1 Month Free" CTA
  │       └─ Click → create-trial-checkout edge function
  │           └─ Stripe Checkout with subscription_data.trial_period_days: 30
  │               └─ $0 now, $9.99/mo after 30 days (uses existing Starter price)
  └─ User returns from Stripe → check-subscription confirms status
```

### New Files

**1. `supabase/functions/check-subscription/index.ts`**
- Authenticates user via JWT
- Looks up Stripe customer by email
- Queries active + trialing subscriptions
- Returns `{ subscribed, status, product_id, subscription_end, trial_end }`

**2. `supabase/functions/create-trial-checkout/index.ts`**
- Authenticates user
- Creates Stripe Checkout session with:
  - `mode: "subscription"`
  - `line_items: [{ price: "price_1T4vr4FJz7YiRCGBNOix6uLP", quantity: 1 }]` (Starter $9.99/mo)
  - `subscription_data: { trial_period_days: 30 }`
  - No `submissionId` required -- this is for app-level premium access
  - `metadata: { userId, type: "premium_trial" }`
- Returns checkout URL

**3. `src/hooks/useSubscription.tsx`**
- Calls `check-subscription` on mount and periodically (every 60s)
- Exposes `{ isSubscribed, isTrialing, trialEnd, subscriptionEnd, isLoading }`
- Provides `startTrial()` function that invokes `create-trial-checkout` and opens the Stripe Checkout URL

### Modified Files

**4. `src/pages/Explore.tsx`**
- Import `useSubscription`
- Add a `FreeTrialBanner` component rendered above the AddServiceCTA:
  - **No subscription**: Gradient card with "1st Month Free" headline, bullet points (full access, cancel anytime), and "Start Free Trial" button
  - **Trialing**: Green badge showing "Premium Trial -- X days left"
  - **Active**: Gold "Premium Member" badge
  - **Loading**: Skeleton

**5. `supabase/config.toml`**
- Add `[functions.check-subscription]` and `[functions.create-trial-checkout]` with `verify_jwt = false`

**6. `supabase/functions/stripe-webhook/index.ts`**
- No changes needed -- the existing `customer.subscription.deleted` handler already covers cancellation. Stripe automatically converts trials to paid after 30 days.

### Stripe Integration Details
- Uses the existing Starter price ID: `price_1T4vr4FJz7YiRCGBNOix6uLP` ($9.99/mo)
- `subscription_data.trial_period_days: 30` tells Stripe to charge $0 upfront, then $9.99/mo after 30 days
- If the user cancels during the trial via the existing customer-portal function, they are never charged
- `check-subscription` queries Stripe for subscriptions with status `active` OR `trialing`

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | Create |
| `supabase/functions/create-trial-checkout/index.ts` | Create |
| `supabase/config.toml` | Add 2 function entries |
| `src/hooks/useSubscription.tsx` | Create |
| `src/pages/Explore.tsx` | Add trial banner UI |

