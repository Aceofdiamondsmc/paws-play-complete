

## Fix: Notification Bell on Dates Tab for Native (Apple) Builds

### Problem
The notification bell in the Dates tab's Care Schedule section always shows "disengaged" on the native iOS build. This happens because `useCareNotifications.tsx` exclusively uses the Web `Notification` API (`typeof Notification !== 'undefined'`), which doesn't exist in the native Capacitor WebView. The `requestPermission()` function returns `false` immediately, and `permissionStatus` stays `'default'` forever.

### Root Cause
Two separate notification systems exist but aren't connected:
1. **Web**: `Notification.requestPermission()` in `useCareNotifications.tsx` — works in browsers only
2. **Native**: `PushNotifications.requestPermissions()` in `App.tsx` and `NotificationPrompt.tsx` — works on native only

The Dates tab bell only checks system #1.

### Solution

**File: `src/hooks/useCareNotifications.tsx`**

Update the hook to detect native platform and use Capacitor's `PushNotifications` API when running natively:

1. **`isNativePlatform()` helper** — check `(window as any).Capacitor?.isNativePlatform?.()`

2. **Initialize `permissionStatus`** — on native, dynamically import `@capacitor/push-notifications` and call `PushNotifications.checkPermissions()` to get the actual current state, mapping `'granted'` to the web-compatible `'granted'` value

3. **`requestPermission()`** — on native, call `PushNotifications.requestPermissions()` and `PushNotifications.register()` instead of `Notification.requestPermission()`. Update `permissionStatus` accordingly.

4. **Triggered reminder notifications** — on native, the actual push delivery is handled by OneSignal/APNs (server-side), so the in-app bell status just needs to reflect the correct permission state. The existing `setTriggeredReminder` logic for UI alerts still works since it's state-based, not API-based.

### What stays the same
- `CareScheduleSection.tsx` UI code — no changes needed, it already reads `permissionStatus` and calls `requestPermission()` from context
- `CareNotificationProvider.tsx` — no changes needed
- `AppLayout.tsx` — no changes needed
- Server-side push via OneSignal edge functions — already handles native delivery

### Apple Review Note
This fix ensures the notification toggle works correctly on the native build, which is important for App Store approval since a non-functional UI element could be flagged as a broken feature.

