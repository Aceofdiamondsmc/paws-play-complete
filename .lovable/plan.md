
## Fix: Native iOS Free Trial Flow Is Failing Before Backend Sync

### What I found
The failure is happening **before Supabase**. There are **no recent logs** for `validate-iap-receipt`, which means the app is not reaching the backend sync step after purchase.

**Do I know what the issue is? Yes.** The most likely code-level problem is in the native purchase path:

- `src/hooks/useIAP.tsx` lets users attempt a purchase **before RevenueCat is fully initialized**
- it only resolves packages via predefined RevenueCat package slots / identifiers (`monthly`, `annual`, `$rc_monthly`, `$rc_annual`)
- it does **not explicitly match your approved App Store product IDs**
  - `com.pawsplayrepeat.starter_monthly`
  - `com.pawsplayrepeat.starter_yearly`

So even if RevenueCat/App Store Connect are configured correctly, the app can still fail locally and collapse everything into the same generic `"Purchase failed. Please try again."` toast.

### Files to update
- `src/hooks/useIAP.tsx` — main fix
- `src/hooks/useSubscription.tsx` — better native start-trial handling
- `src/pages/Plans.tsx` — disable buttons until store is ready
- optionally `src/components/services/FreeTrialBanner.tsx` — keep the same native loading behavior there too

### Plan
**1. Harden RevenueCat initialization**
- Add an explicit “store ready” guard after `Purchases.configure(...)`
- Prevent `purchaseByType(...)` from running while RevenueCat is still initializing
- Return a specific native result for “store still loading” instead of generic failure

**2. Fetch and resolve the default offering more reliably**
- Refresh/fetch the default offering immediately before purchase
- Match packages by your real approved product IDs first:
  - monthly → `com.pawsplayrepeat.starter_monthly`
  - yearly → `com.pawsplayrepeat.starter_yearly`
- Keep `MONTHLY` / `ANNUAL` package-type lookup only as fallback

**3. Improve native error reporting**
- Remove remaining “web checkout” wording from native IAP toasts
- Surface separate messages for:
  - RevenueCat not initialized
  - no current offering returned
  - package not found in the offering
  - App Store / SDK purchase exception
  - user cancelled
- Add better console logging so the next test clearly shows where it fails

**4. Prevent premature taps in the UI**
- Disable both “Start Free Trial” buttons on `/plans` while native IAP is loading
- Show a loading state until the store is ready
- Keep native iOS fully isolated from Stripe

**5. Keep backend sync unchanged after successful purchase**
- Continue checking entitlement ID `premium`
- Continue syncing through `validate-iap-receipt` only after a successful purchase
- Use post-fix logs to confirm the handshake finally reaches Supabase

**6. Retest on device**
- Install the updated iOS build on a physical iPhone
- Open `/plans`, wait for the store to finish loading, then test monthly and yearly once each
- Expected result:
  - either the App Store sandbox purchase sheet opens
  - or the app now shows a precise failure reason instead of the generic purchase error

### Technical details
- `src/hooks/useIAP.tsx` currently assumes the offering exposes `currentOffering.monthly` / `annual` or `$rc_monthly` / `$rc_annual`
- that is brittle if the approved Starter products are present but the offering/package setup is custom
- because this app is a bundled Capacitor iOS app (no live `server.url` override), this fix will require a **new iOS build/sync** before testing on-device
