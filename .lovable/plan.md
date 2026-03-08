

## Add Sign In / Sign Up CTA to Dates Page

The Dates page already has an unauthenticated state (lines 90-103) but it's just static text with no actionable button. Since Dates is now the first tab, this is the first thing logged-out users see.

### Change: `src/pages/Dates.tsx` (lines 90-103 area)

Add a styled button below the existing "Sign In Required" text that navigates to `/me`:

- **"Sign In / Sign Up"** button using the app's primary `Button` component with `rounded-full` styling
- Uses `navigate('/me')` on click (the Me page handles auth flows)
- Optionally a secondary subtle link: "Browse as guest" pointing to `/explore`

This keeps it simple — one button addition to the existing unauthenticated splash screen. No new components needed.

