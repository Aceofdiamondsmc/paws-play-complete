

## Show Free Trial CTA to Logged-Out Users

Update `FreeTrialBanner` to display a sign-up prompt for unauthenticated users instead of returning `null`.

### Change

**`src/components/explore/FreeTrialBanner.tsx`**

Remove the early `if (!user) return null;` guard. Add a new render branch for logged-out users that shows a CTA card with:
- Sparkles icon + "1st Month Free" heading
- Same benefit list as the existing CTA
- "Then $9.99/month" subtitle
- Button labeled "Sign Up to Start Free Trial" that navigates to the login/signup page using `react-router-dom`'s `useNavigate` (navigate to `/` or wherever the auth flow lives — need to check)

Let me verify the auth route.
