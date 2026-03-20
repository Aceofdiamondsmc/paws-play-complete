

## Plan: Apply safe-area padding to remaining headers

### Analysis

After auditing all pages and sticky headers:

- **Already fixed**: `AdminLayout`, `SubmitService`, `SubmissionSuccess`, `Landing`, `ChatView` — all have safe-area padding
- **Inside AppLayout** (Parks, Explore, Social, ServiceDetails, etc.) — these render below the main `Header` which already has `safe-top`, so their sub-headers are not at risk of being behind the Dynamic Island
- **Outside AppLayout, NOT fixed**: `ForgotPassword.tsx` and `ResetPassword.tsx` — these are standalone pages with `pt-8` top padding, which may not clear the Dynamic Island on iPhone 15 Pro Max

### Changes

#### 1. `src/pages/ForgotPassword.tsx`
- Change the outer `<div>` from `pt-8` padding to use `paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)'` inline style, ensuring the content clears the Dynamic Island while maintaining the visual spacing

#### 2. `src/pages/ResetPassword.tsx`
- Same change on both render paths (the "Invalid Link" view and the main password reset form) — replace the fixed `pt-8` with the safe-area-aware inline style

These are the only two pages outside `AppLayout` that don't already have the safe-area pattern applied. All pages inside `AppLayout` are protected by the main `Header` component's `safe-top` class.

