

## Fix: Consolidate Service CTAs, Fix Purchase Flow, Improve Plans Layout

### 1. Consolidate FreeTrialBanner + AddServiceCTA into One Card

**Files:** `src/components/explore/FreeTrialBanner.tsx`, `src/pages/Explore.tsx`

Remove `AddServiceCTA` from the Services page entirely. Merge its business-focused messaging into `FreeTrialBanner`'s "no subscription" state (both logged-out and logged-in). The consolidated card will read:

**Headline:** "Promote Your Pet Business — 1st Month Free"  
**Bullets:**
- Get listed in our local pet services directory
- Searchable by thousands of nearby pet owners  
- Your contact info and business profile displayed  
- Cancel anytime — no charge within 30 days

This replaces the current generic "Full access to premium features" and "Featured placement options" copy with language that actually sells the directory listing value.

The "Premium Member" and "Trial Active" states remain unchanged.

### 2. Fix "Purchase Failed" on Plans Page

**Files:** `src/pages/Plans.tsx`, `src/hooks/useIAP.tsx`

**Root cause:** Both Monthly and Yearly buttons call the same `startTrial()` → `iap.purchase()`, which always picks `currentOffering.monthly || availablePackages[0]`. There is no way to select the yearly package, and if RevenueCat offerings aren't returning a `monthly` key, it falls through unpredictably.

**Fix:**
- Add a `purchasePackageByType` method to `useIAP` that accepts `'monthly' | 'annual'` and selects the correct package from `currentOffering.monthly` or `currentOffering.annual`.
- Update `useSubscription` to expose `startTrialMonthly` and `startTrialYearly` (or a `startTrial(type)` variant).
- Wire the Monthly card button to the monthly package and the Yearly card button to the annual package.
- Add better error logging to capture what `getOfferings()` actually returns when it fails.

### 3. Fix Excessive Empty Space on Plans Page

**File:** `src/pages/Plans.tsx`

- Reduce `py-8` → `py-4` and `space-y-8` → `space-y-5` on the main container.
- Add `pb-safe` or `pb-8` at the bottom instead of the current sprawling layout.
- Tighten spacing between the hero section, plan cards, and footer.
- Use `min-h-[calc(100vh-56px)]` with `justify-between` flex layout so content hugs the top without large gaps.

### Summary of File Changes

| File | Change |
|---|---|
| `src/hooks/useIAP.tsx` | Add `purchaseByType(type: 'monthly' \| 'annual')` method with better error logging |
| `src/hooks/useSubscription.tsx` | Expose `startTrial(type)` that passes package type through to IAP |
| `src/pages/Plans.tsx` | Wire monthly/yearly buttons to correct packages; tighten spacing |
| `src/components/explore/FreeTrialBanner.tsx` | Merge business CTA copy into the no-subscription states |
| `src/pages/Explore.tsx` | Remove `AddServiceCTA` import and usage (line 203) |
| `src/components/explore/AddServiceCTA.tsx` | Can be deleted (no longer used) |

