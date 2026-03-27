

## Fix "Test Local Notification" Button on Native iOS

### Problem
The `handleTestLocal` function in `AdminTools.tsx` uses the **browser `Notification` API** (`new Notification(...)`), which is not available inside a native iOS Capacitor WebView. The permission also shows "unknown" because it checks `window.Notification` which doesn't exist on native.

### Solution
Update the test button and the permission diagnostics to detect native vs web and use the correct API:

**File: `src/pages/admin/AdminTools.tsx`**

1. **Permission detection (lines 49-62)**: Add a native branch that checks permissions via `@capacitor/local-notifications` and `@capacitor/push-notifications` using dynamic imports, same pattern used elsewhere in the codebase.

2. **`handleTestLocal` function (lines 64-78)**: On native, use `LocalNotifications.schedule()` from `@capacitor/local-notifications` to fire a test notification. On web, keep existing `new Notification()` logic.

3. **Add `isNative` detection**: Use the same `!!(window as any).Capacitor?.isNativePlatform?.()` pattern already used in `useCareNotifications.tsx`.

### Changes

| What | Where |
|---|---|
| Add `isNative` constant | Top of component |
| Update permission check `useEffect` to handle native | Lines 49-62 |
| Update `handleTestLocal` to use Capacitor LocalNotifications on native | Lines 64-78 |

Single file change. No new dependencies needed — `@capacitor/local-notifications` is already installed.

