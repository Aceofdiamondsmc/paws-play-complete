

## Fix: Infinite Spinner on Plans Page (Native iOS)

### Root Cause

The Plans page checks `storeLoading = isNative && !iap.storeReady` to decide whether to show the spinner. But if RevenueCat initialization **fails** (e.g. offerings can't be fetched, network issue, SDK error), `storeReady` stays `false` forever while `isLoading` gets set to `false`. The buttons never stop spinning because they only check `storeReady`, not `isLoading`.

### Fix

**File: `src/pages/Plans.tsx`** (lines 25-26, 76-78, 112-114)

1. Change the loading check to also consider `iap.isLoading` — the spinner should only show while the store is **actively loading**, not after a failure:
   - `storeLoading = isNative && iap.isLoading` (was `!iap.storeReady`)
   - Add a new `storeError = isNative && !iap.isLoading && !iap.storeReady` state
2. When `storeError` is true, show "Retry" or a clear error message instead of infinite spinner
3. Buttons remain disabled during loading but show actionable text after failure

**File: `src/hooks/useIAP.tsx`** (lines 45-70)

4. Add a retry mechanism: expose a `retryInit` function so users can tap to re-initialize if the store failed to load
5. Add a timeout (e.g. 15 seconds) to the init so it doesn't hang forever if `getOfferings()` never resolves

### Result
- While store is initializing: buttons show spinner + "Loading..."
- If init fails: buttons show "Store unavailable — Tap to retry" instead of infinite spinner
- If init succeeds: buttons show "Start Free Trial" as expected

