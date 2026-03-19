

## Fix Flyer Printing on Native iOS + Admin Dashboard Exit Button

### Problem 1: Flyer fails on native iOS
The current code creates a `data:text/html;base64,...` URL from a Blob and passes it to `Browser.open()`. iOS Safari and the Capacitor Browser plugin reject data URLs — they cannot navigate to `data:` scheme URLs. This triggers the "Could not open flyer for printing" error.

**Fix**: Instead of a data URL, use a `blob:` URL via `URL.createObjectURL()`. However, Capacitor Browser also can't open blob URLs in the system browser. The real fix is to **use the web iframe approach for all platforms** — the hidden iframe + `window.print()` works inside the Capacitor WebView too. Remove the native-specific branch entirely.

### Problem 2: Admin Dashboard back button doesn't work on native
The back button calls `navigate('/me')`, which uses React Router navigation. On native iOS, this should work, but the issue is likely that the admin layout sits outside the normal `AppLayout` with `BottomNav`, so the `/me` route navigation may not be resolving correctly, or the button area is obscured by the iOS safe area despite the `safe-top` class — the `pt-4` padding pushes the button down but the tap target may still be under the status bar area.

**Fix**: Increase the header height and ensure the back button has adequate tap target area. Also add `window.history.back()` as a fallback if navigate doesn't work on native.

### Files Changed

| File | Change |
|------|--------|
| `src/components/lost-dog/LostDogAlertModal.tsx` | Remove native `Browser.open` branch; use iframe print approach for all platforms |
| `src/components/admin/AdminLayout.tsx` | Fix back button tap target and add fallback navigation for native iOS |

### Technical Details

**Flyer fix** — Remove lines 107 and 121-135 (the `isNative` check and `Browser.open` branch). The iframe approach (lines 137+) already works universally, including inside Capacitor WebViews.

**Admin exit fix** — The header currently uses `pt-4 sm:pt-0` which may not be enough on newer iPhones with dynamic island. Change to use `env(safe-area-inset-top)` padding and increase the header min-height. Also make the back button larger with explicit min tap target of 44x44px (Apple HIG minimum).

