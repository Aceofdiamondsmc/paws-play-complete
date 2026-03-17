

## Problem

OAuth redirects use `window.location.origin` (e.g. `https://pawsplayrepeat.lovable.app/me`), which opens Safari. On a native Capacitor app, Safari can't redirect back because there's no deep link scheme configured. The app needs to use the custom URL scheme `com.pawsplayrepeat.app://callback` so the OS routes the redirect back into the app.

## Plan

### 1. Update `useAuth.tsx` — use native scheme for OAuth redirects

Detect if running inside Capacitor (`window.Capacitor`), and use the custom scheme redirect:

- `signInWithGoogle`: change `redirectTo` to `com.pawsplayrepeat.app://callback` when native
- `signInWithApple`: same change
- `signUp` `emailRedirectTo`: same pattern (so email confirmation links also return to the app)

```typescript
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
const redirectUrl = isNative
  ? 'com.pawsplayrepeat.app://callback'
  : `${window.location.origin}/me`;
```

Apply this pattern to `signInWithGoogle`, `signInWithApple`, and `signUp`.

### 2. Add deep link handling in `capacitor.config.ts`

Add the `server` and `plugins` config for App URL handling:

```typescript
const config: CapacitorConfig = {
  appId: 'com.pawsplayrepeat.app',
  appName: 'Paws Play Repeat',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: { enabled: true },
  },
};
```

The `appId` already matches the scheme `com.pawsplayrepeat.app`, so the iOS `CFBundleURLSchemes` (set via `npx cap sync`) will register the scheme correctly.

### 3. Add Supabase redirect URL to allowed list

**Manual step**: In Supabase Dashboard → Authentication → URL Configuration → add `com.pawsplayrepeat.app://callback` to **Redirect URLs**.

### Summary

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Use `com.pawsplayrepeat.app://callback` as `redirectTo` on native |
| `capacitor.config.ts` | No structural change needed (appId already correct) |
| Supabase Dashboard | Add `com.pawsplayrepeat.app://callback` to allowed redirect URLs |

