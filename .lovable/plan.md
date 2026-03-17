

## Fix "Sign Up to Start Free Trial" Navigation

The button in `FreeTrialBanner.tsx` (line 39) currently navigates to `'/'` (landing page). It should navigate to `'/me'` so unauthenticated users are taken to the Me tab where they can sign up/sign in.

### Change
- **`src/components/explore/FreeTrialBanner.tsx`** line 39: Change `navigate('/')` → `navigate('/me')`

One line, one file.

