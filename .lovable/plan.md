

## Problem

The "Enable Notifications" button in `NotificationPrompt.tsx` only uses the **OneSignal Web SDK** (`window.OneSignalDeferred`). In a native TestFlight build, `window.OneSignalDeferred` is `undefined`, so the code falls into the `else` branch and shows "Notification service unavailable." The native app needs to use `@capacitor/push-notifications` instead.

The iOS entitlements, `capacitor.config.ts`, and `AppDelegate.swift` are already correctly configured. The only missing piece is the **code path** in `NotificationPrompt.tsx`.

## Plan

### Update `src/components/notifications/NotificationPrompt.tsx`

Add a native code path in `handleEnableNotifications`:

1. Detect native platform: `const isNative = !!(window as any).Capacitor?.isNativePlatform?.()`
2. If native, import and use `@capacitor/push-notifications`:
   - Call `PushNotifications.requestPermissions()`
   - If granted, call `PushNotifications.register()`
   - Listen for `registration` event to get the device token
   - Save the token to the user's profile (`onesignal_player_id` column) and dismiss the prompt
3. If not native, keep the existing OneSignal web flow unchanged

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Inside handleEnableNotifications:
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

if (isNative) {
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive === 'granted') {
    await PushNotifications.register();
    PushNotifications.addListener('registration', async (token) => {
      // Save token.value to profile
      await supabase.from('profiles')
        .update({ onesignal_player_id: token.value, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      toast.success('Notifications enabled! 🔔');
      setPromptType(null);
    });
  } else {
    toast.info('Notifications declined');
    setPromptType(null);
  }
} else {
  // existing OneSignal web flow
}
```

### Also update visibility logic

The `useEffect` that controls prompt visibility currently checks `profile.onesignal_player_id` and iOS standalone mode. On native, it should always show the standard prompt (not the iOS-install prompt). Add the native check:

```typescript
if (isNative) {
  // Native app — show standard prompt directly
  const timer = setTimeout(() => setPromptType('standard'), 3000);
  return () => clearTimeout(timer);
}
```

### Summary

| File | Change |
|------|--------|
| `src/components/notifications/NotificationPrompt.tsx` | Add native Capacitor push path alongside existing OneSignal web path |

No changes needed to `capacitor.config.ts`, `App.entitlements`, or `AppDelegate.swift` — all already configured correctly.

