

## Fix: In-App OAuth Sign-In Using Safari View Controller

### Problem
Apple rejected the app because OAuth sign-in (Google/Apple) opens the **default Safari browser**, taking users out of the app. Apple requires the sign-in to happen **within the app** — either natively or via `SFSafariViewController` (Safari View Controller).

### Solution
Use `@capacitor/browser` (already installed) which renders `SFSafariViewController` on iOS. Instead of letting Supabase's `signInWithOAuth()` redirect to the default browser, we manually construct the OAuth URL using `supabase.auth.signInWithOAuth({ skipBrowserRedirect: true })` and open it with `Browser.open()`.

When the OAuth callback fires (via the custom URL scheme `com.pawsplayrepeat.app://callback`), the existing `appUrlOpen` listener in `App.tsx` will capture the tokens, set the session, and we close the in-app browser.

### Changes

**1. `src/hooks/useAuth.tsx`** — Update `signInWithGoogle` and `signInWithApple`

For native platforms only:
- Add `skipBrowserRedirect: true` to `signInWithOAuth()` options — this returns the OAuth URL without opening a browser.
- Use `Browser.open({ url })` from `@capacitor/browser` to open it in `SFSafariViewController`.
- Web flow remains unchanged (standard redirect).

```typescript
const signInWithGoogle = async () => {
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  const redirectUrl = isNative
    ? 'com.pawsplayrepeat.app://callback'
    : `${window.location.origin}/me`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { prompt: 'select_account' },
      skipBrowserRedirect: isNative, // Don't auto-open browser on native
    }
  });

  if (isNative && data?.url) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: data.url, presentationStyle: 'popover' });
  }

  return { error };
};
```

Same pattern for `signInWithApple`.

**2. `src/App.tsx`** — Close in-app browser after OAuth callback

In the existing `appUrlOpen` listener, after successfully setting the session, close the Safari View Controller:

```typescript
if (accessToken && refreshToken) {
  const { error } = await supabase.auth.setSession({ ... });
  if (!error) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  }
}
```

### Why This Works
- `@capacitor/browser` uses `SFSafariViewController` on iOS — Apple's recommended approach
- Users see the URL bar and SSL certificate (Apple's requirement)
- Users stay "in the app" — no context switch to Safari
- The existing deep link listener handles the callback seamlessly
- Web users are unaffected — `skipBrowserRedirect` is only `true` on native

