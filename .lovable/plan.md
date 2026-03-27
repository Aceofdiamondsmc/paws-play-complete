

## Fix Apple Review Rejections: Guideline 4 (Sign in with Apple) + Guideline 3.1.1 (In-App Purchase)

### Issue 1: Guideline 4 — Sign in with Apple asks for name again

**Problem**: After Apple Sign-In, the onboarding flow (`OnboardingProfileSetup.tsx`) requires users to enter their display name — but Apple already provides this via the Authentication Services framework. Apple considers this a violation.

**Fix**: Pre-fill the display name from Supabase auth user metadata (which receives Apple's provided name) and make the field optional instead of required.

| File | Change |
|---|---|
| `src/components/profile/OnboardingProfileSetup.tsx` | Read `user.user_metadata.full_name` or `user.user_metadata.name` from auth context to pre-fill `displayName`. Remove the required validation on line 54. |
| `src/components/profile/OnboardingFlow.tsx` | Pass `user` from `useAuth()` into `OnboardingProfileSetup` so it can access metadata. |

This is a small change — about 10 lines across 2 files.

---

### Issue 2: Guideline 3.1.1 — Subscriptions must use In-App Purchase on iOS

**Problem**: The app uses Stripe Checkout for the $9.99/month Starter subscription. Apple requires native StoreKit In-App Purchase for any paid digital content/subscriptions within iOS apps.

**Solution**: Implement Apple IAP using RevenueCat (the industry-standard wrapper for StoreKit that works with Capacitor). On native iOS, the subscription flow uses IAP. On web, Stripe remains unchanged.

#### Prerequisites (manual steps by you in App Store Connect + RevenueCat)

1. **App Store Connect**: Create an auto-renewable subscription product
   - Product ID: e.g. `com.pawsplayrepeat.starter_monthly`
   - Price: $9.99/month
   - Set up a Subscription Group
   - Enable the 30-day free trial offer

2. **RevenueCat account**: Create a project at rev.cat, connect your App Store Connect app, and get your **RevenueCat Public API Key** (starts with `appl_`)

3. **Entitlement**: Create an entitlement called `premium` in RevenueCat and attach the product

#### Code Changes

| File | Change |
|---|---|
| **New: `src/hooks/useIAP.tsx`** | Hook that wraps RevenueCat's Capacitor SDK. On native, initializes RevenueCat, checks entitlements, and provides `purchasePackage()`. On web, falls back to existing Stripe logic. Exposes: `isPremium`, `purchase()`, `restore()`, `manageSubscription()`. |
| `src/hooks/useSubscription.tsx` | On native iOS, delegate to `useIAP` instead of calling the `check-subscription` edge function. On web, keep Stripe logic unchanged. |
| `src/components/explore/FreeTrialBanner.tsx` | On native iOS, the "Start Your Free Trial" button calls IAP `purchase()` instead of Stripe checkout. UI stays the same. |
| `src/pages/Me.tsx` | "Manage Subscription" on native opens App Store subscription management instead of Stripe portal. |
| **New: `supabase/functions/validate-iap-receipt/index.ts`** | Edge function that receives Apple receipt data from the client, validates it with Apple's servers, and updates the `subscriptions` table — keeping the existing subscription state in sync. |

#### New dependency
- `@revenuecat/purchases-capacitor` — RevenueCat's official Capacitor plugin

#### Architecture on native iOS

```text
User taps "Start Free Trial"
  → RevenueCat SDK presents Apple's native purchase sheet
  → Apple handles payment + trial
  → RevenueCat confirms entitlement
  → App updates local subscription state
  → validate-iap-receipt edge function syncs to DB
```

#### Architecture on web (unchanged)

```text
User taps "Start Free Trial"
  → Stripe Checkout via create-trial-checkout edge function
  → stripe-webhook syncs to subscriptions table
```

### Implementation order

1. Fix Sign in with Apple name pre-fill (quick, unblocks Guideline 4)
2. Install `@revenuecat/purchases-capacitor`
3. Create `useIAP` hook with platform detection
4. Update `useSubscription` to use IAP on native
5. Update `FreeTrialBanner` and `Me.tsx` for native purchase flow
6. Create `validate-iap-receipt` edge function
7. You set up products in App Store Connect and RevenueCat dashboard

### What you need to provide before implementation
- RevenueCat Public API Key (after creating your RevenueCat project)
- The exact product ID you create in App Store Connect

### Technical note
RevenueCat is free for up to $2,500/month in tracked revenue. It handles receipt validation, entitlement management, and cross-platform subscription state — eliminating the need to build raw StoreKit integration.

