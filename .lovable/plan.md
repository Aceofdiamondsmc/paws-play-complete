

## Add "Sign in with Apple" + Fix Pre-existing Build Errors

### Part 1: Sign in with Apple

**`src/hooks/useAuth.tsx`**
- Add `signInWithApple` method to `AuthContextType` interface and implementation
- Uses `supabase.auth.signInWithOAuth({ provider: 'apple' })` — identical pattern to Google, no platform-specific code needed
- Supabase handles the universal OAuth flow for both iOS and Android

**`src/pages/Me.tsx`**
- Destructure `signInWithApple` from `useAuth()`
- Add `handleAppleSignIn` handler mirroring Google's pattern
- Add a branded black button with white Apple logo SVG below the Google button, per Apple HIG:

```text
[ Continue with Google     ]   ← existing
[  Sign in with Apple     ]   ← new, black bg, white text
```

### Part 2: Fix 9 Pre-existing Build Errors in Edge Functions

| File | Fix |
|------|-----|
| `check-subscription/index.ts` | Add `Stripe.Subscription` type annotation to `.find()` callback |
| `create-trial-checkout/index.ts` | Add `Stripe.Subscription` type annotation to `.some()` callback |
| `get-weather/index.ts` | Cast `error` to `Error` in catch block |
| `lost-dog-alert/index.ts` | Cast `error` to `Error` in catch block |
| `stripe-webhook/index.ts` | Change `upsertSubscription` param type from `ReturnType<typeof createClient>` to `any`; cast `row` in `.upsert()` call |
| `welcome-email/index.ts` | Cast `error` to `Error` in catch block |

### Note
Apple provider must be enabled in your Supabase dashboard under **Authentication → Providers → Apple** for sign-in to work.

