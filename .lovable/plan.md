

## Replace Services Tab CTAs with /plans Navigation

### Problem
The "Free Trial" banner and "Add Your Service" CTA on the Services tab reference Stripe-based pricing ($9.99/month) and a web checkout flow. On native iOS, Apple requires all digital subscription purchases go through IAP. These CTAs could confuse the Apple reviewer and conflict with the new `/plans` page.

### Solution
On **native iOS**, both components should route users to `/plans` instead of triggering Stripe flows or showing Stripe pricing. On **web**, keep existing behavior.

### Changes

| File | Change |
|---|---|
| `src/components/explore/FreeTrialBanner.tsx` | When `isNative` and user has no subscription: replace "Start Your Free Trial" button to navigate to `/plans` instead of calling `startTrial()` (which triggers Stripe). Same for the logged-out CTA — navigate to `/plans`. Keep the trial-active and subscribed states as-is since those are display-only. |
| `src/components/explore/AddServiceCTA.tsx` | On native: change the "Add Your Service" button to navigate to `/plans` instead of `/submit-service`. Update the "$9.99/month" text to say "See Plans" on native. On web: keep current behavior. |

### Detail

**FreeTrialBanner** (lines 122-171, no-subscription state):
- If `isNative`: button navigates to `/plans` instead of calling `handleStartTrial()`
- Logged-out CTA (lines 22-47): same — navigate to `/plans` on native

**AddServiceCTA**:
- Add `isNative` check at top
- If native: button navigates to `/plans`, bottom text says "See Plans" instead of "$9.99/month"

Two files, minimal changes. No new dependencies.

