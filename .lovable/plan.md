

## Plan: Three changes

### 1. Add safe-area header to SubmitService page (like AdminLayout)

The "Add Your Service" pages (`SubmitService.tsx`) use a plain `<div>` header without safe-area padding. On iPhone 15 Pro Max, the back arrow gets hidden behind the Dynamic Island — same issue as the admin dashboard.

**File: `src/pages/SubmitService.tsx` (lines 188-200)**

- Add `paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)'` to the header div
- Increase the back button tap target to 44x44px minimum (`min-w-[44px] min-h-[44px]`)
- Apply the same pattern to the `SubmissionSuccess.tsx` page (add a header with a back button + safe-area padding)

### 2. Fix "Start Your Free Trial" button

The `startTrial` function in `useSubscription.tsx` calls `supabase.functions.invoke('create-trial-checkout')`, but the edge function may not be deployed. The function exists in the codebase at `supabase/functions/create-trial-checkout/index.ts`.

**Action**: Deploy the `create-trial-checkout` edge function.

Also, `window.open(data.url, '_blank')` can be blocked by iOS popup blockers. Change to `window.location.href = data.url` (same pattern as `manageSubscription`) for reliable behavior on iOS.

**File: `src/hooks/useSubscription.tsx` (line 67)**
- Change `window.open(data.url, '_blank')` to `window.location.href = data.url`

### 3. Change Free Trial banner color to green

**File: `src/components/explore/FreeTrialBanner.tsx`**

Update the two CTA banner variants (logged-out and no-subscription) from `border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5` to green: `border-success/30 bg-gradient-to-br from-success/10 via-success/5`. Change accent elements (blur circle, icon, button) from `primary` to `success` coloring. Keep the button using a green-themed class.

### Summary of file changes

| File | Change |
|------|--------|
| `src/pages/SubmitService.tsx` | Add safe-area padding + larger tap target on header back button |
| `src/pages/SubmissionSuccess.tsx` | Add header with safe-area back button |
| `src/hooks/useSubscription.tsx` | Change `window.open` to `window.location.href` |
| `src/components/explore/FreeTrialBanner.tsx` | Restyle CTA banners to green |
| Edge function deploy | Deploy `create-trial-checkout` |

