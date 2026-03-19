

## Fix Care Schedule Reminders on iOS Native (Apple Build)

### Root Cause Analysis

Three issues prevent reminders from working on the native iOS app:

1. **In-app alerts gated on push permission**: The reminder-checking loop in `useCareNotifications.tsx` (line 152) only runs when `permissionStatus === 'granted'`. On native iOS, `Notification` is undefined in WKWebView, so it initializes as `'default'`. Even though an async check updates it, the in-app UI banner and sound should not depend on push permission at all.

2. **No local notifications for background delivery**: The app relies on client-side JS polling every 30 seconds to match reminder times. When the iOS app is backgrounded or the screen is locked, JavaScript execution stops entirely. There are no `@capacitor/local-notifications` scheduled, so reminders never fire when the app isn't actively open.

3. **Push token not re-registered on app launch**: The native push token is only sent to OneSignal during the first-time `NotificationPrompt` flow. If the token rotates (common on iOS) or the OneSignal subscription lapses, the server-side `care-reminder-push` edge function fails with "unsubscribed subscriptions" (visible in the logs).

### Plan

#### 1. Decouple in-app alerts from push permission (`useCareNotifications.tsx`)

- Remove the `permissionStatus !== 'granted'` guard from the reminder-checking effect (line 152)
- The in-app banner (`triggeredReminder`) and Web Audio sounds should always fire when the app is foregrounded, regardless of push permission status
- Keep the `!isNative()` guard on `new Notification()` calls (web-only browser notifications)

#### 2. Add local notification scheduling (`useCareNotifications.tsx`)

- On native platforms, use `@capacitor/local-notifications` to schedule a local notification for each enabled reminder
- When reminders change (added, deleted, toggled, snoozed), cancel and reschedule all local notifications
- This ensures reminders fire even when the app is backgrounded or the screen is locked
- Use the existing category titles/bodies for notification content

#### 3. Re-register push token on every app launch (`App.tsx`)

- When the app launches on native and push permission is already granted, listen for the `registration` event and call `register-push-token` to keep the OneSignal subscription active
- This prevents the "unsubscribed" state that causes server-side push to fail

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCareNotifications.tsx` | Remove permission gate on in-app alerts; add local notification scheduling via `@capacitor/local-notifications` |
| `src/App.tsx` | Re-register native push token on launch when already granted |

### Notes
- `@capacitor/local-notifications` is already available via Capacitor core; no new package install needed
- The server-side `care-reminder-push` edge function remains unchanged — it continues as a backup delivery mechanism
- After implementation, the user must `npx cap sync` and rebuild the iOS app

