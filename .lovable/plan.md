

## Add Google Account Chooser Prompt

### Change

In `src/hooks/useAuth.tsx`, add `queryParams: { prompt: 'select_account' }` to the `signInWithGoogle` method's OAuth options. This forces Google to show the account picker every time instead of auto-selecting the last used account.

### File: `src/hooks/useAuth.tsx` — `signInWithGoogle` method

Add `queryParams` to the existing options object:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl,
    queryParams: { prompt: 'select_account' }
  }
});
```

One-line addition. No other files affected.

