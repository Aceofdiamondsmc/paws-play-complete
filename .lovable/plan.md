

## Hide App Store Badge on Native iOS App (Keep on Web)

### Problem
The Landing page footer shows a "Coming Soon" App Store badge. This should not appear when the user is running the app on an actual Apple device (native Capacitor app), but should remain visible on the web version.

### Solution

**File: `src/pages/Landing.tsx`**

Wrap the App Store badge block (lines 128-144) in a conditional that hides it when running as a native Capacitor app. Use the existing detection pattern from the codebase:

```tsx
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
```

If `isNative` is true, skip rendering the badge entirely. Web users (including PWA) will still see it.

### Changes

| What | Where |
|---|---|
| Add `isNative` check, conditionally render badge | `src/pages/Landing.tsx` ~line 128 |

Single file, ~3 lines added. No iOS build needed — the native app loads this code dynamically.

