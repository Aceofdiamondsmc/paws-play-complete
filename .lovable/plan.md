

## Answers & Fix Plan

### 1. Account Deletion Confirmation — Already Exists
The `Me.tsx` page already has an `AlertDialog` confirmation step (lines 629-648) before deleting. It shows "Delete Your Account?" with a description about permanent data loss, plus Cancel / Delete My Account buttons. The Delete button is styled red (`bg-destructive`). No code changes needed here.

### 2. "Expired Free Trial" — Yes, Subscription Related
Yes, Apple is likely referring to the Stripe-based free trial for the Services subscription. When the trial expires and the user hasn't converted, the `check-subscription` edge function returns `status: 'canceled'` or similar. This is handled correctly. No code change needed — just explain this to Apple in your business model answers (Issue 3).

### 3. Guest Map Access — Requires Edge Function Change
The `mapbox-token` edge function **requires authentication** (checks `Authorization` header and validates user). The `ParksMap` component also checks for a session and throws "Please sign in to view the map" if none exists. For guest browsing to work on Parks, both need updating:

**Changes:**

**A. `supabase/functions/mapbox-token/index.ts`**
- Allow unauthenticated requests by making the auth check optional. If a valid user token is present, proceed as before. If not, still return the Mapbox token (the token is a restricted/public token anyway — it's just hidden from source code).

**B. `src/components/parks/ParksMap.tsx`**
- Remove the session check that throws an error. Instead, call the edge function without the `Authorization` header when no session exists, or use `supabase.functions.invoke('mapbox-token')` which auto-includes the anon key.

### 4. Demo Account Created — Noted
You've created John Apple (@JohnnyApple) with subscription access. Use these credentials in App Store Connect's "App Review Information" section.

### 5. Social Page Header Too High — Safe Area Fix
The sticky header in `Social.tsx` (line 459) uses `pt-12` which is a fixed value. On iOS devices with the Dynamic Island / notch, this doesn't account for the safe area inset, causing the "Pack Community" title and filter tabs to sit too high, overlapping with the status bar / address bar.

**Fix: `src/pages/Social.tsx`**
- Replace the fixed `pt-12` on the sticky header with dynamic safe-area padding, matching the pattern used on other pages:
  ```
  style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)' }}
  ```
- Remove the `pt-12` class and use inline style instead.

---

### Summary of Code Changes

| File | Change |
|---|---|
| `supabase/functions/mapbox-token/index.ts` | Make auth optional — return token for both authenticated and anonymous requests |
| `src/components/parks/ParksMap.tsx` | Remove session requirement, allow map init without auth |
| `src/pages/Social.tsx` | Fix sticky header padding to use safe-area-inset-top instead of fixed `pt-12` |

No changes needed for questions 1, 2, or 4.

