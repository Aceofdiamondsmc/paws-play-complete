

## Fix: NotificationPrompt Banner + Guard Web-Only Notification API on Native

### Two Changes

**1. `src/components/notifications/NotificationPrompt.tsx`**

The banner only shows when `!profile.onesignal_player_id`. On native iOS, the profile may already have a token stored (from a previous registration or fallback), permanently hiding the banner even if push permissions aren't actually granted.

**Fix:** On native platforms, check actual push permission status via dynamic import of `@capacitor/push-notifications`. Only suppress the prompt if permission is truly `'granted'`. Also replace the static import on line 9 (`import { PushNotifications } from '@capacitor/push-notifications'`) with dynamic imports throughout to prevent web build issues.

- Remove line 9 static import
- In the `useEffect` (line 26): on native, dynamically import and call `PushNotifications.checkPermissions()`. If not `'granted'`, show the `'standard'` prompt regardless of `onesignal_player_id`
- Keep existing web/iOS-install logic unchanged for non-native

**2. `src/hooks/useCareNotifications.tsx`**

Two places call `new Notification(...)` which crashes silently on native Capacitor WebView:
- **Line 128-133**: missed medication web notification
- **Line 185-189**: triggered reminder web notification

**Fix:** Wrap both `new Notification(...)` calls with `if (!isNative())` guards. The `playReminderSound()` / `playUrgentSound()` calls and `setTriggeredReminder()` state updates remain for both platforms. On native, actual push delivery happens server-side via OneSignal/APNs.

Also expand `getCategoryTitle` and `getCategoryBody` to cover all existing categories (grooming, training, vet_visit, birthday) instead of falling through to the generic "Dog Walk" default.

### No missed medication UI changes
The missed medication polling and alert cards in `CareScheduleSection.tsx` already exist and work. This fix only guards the web-only `new Notification()` constructor — no new missed medication UI is being added.

### Technical Details
- `isNative()` helper already exists in both files
- Dynamic import pattern: `const { PushNotifications } = await import('@capacitor/push-notifications')`
- No database or Edge Function changes needed

