

## Problem Analysis

The Web Audio API sounds (`src/lib/alert-sounds.ts`) only work when the app is **actively open in the foreground**. When the app is closed or in the background, only OneSignal push notifications can reach the user -- and those currently use the **device's default notification sound** (or no sound if notifications are silenced).

There are two separate issues to address:

### 1. Background/Closed App (Push Notifications)
The `care-reminder-push` Edge Function sends OneSignal push notifications but doesn't specify a custom sound. OneSignal supports an `android_sound` and `ios_sound` parameter, but:
- **Android PWA**: Custom sounds work if you provide a sound file name
- **iOS PWA**: Custom notification sounds are **not supported** by iOS for web push -- it always uses the system default

**Fix**: Add sound parameters to the OneSignal push payload in `supabase/functions/care-reminder-push/index.ts` so Android devices play a sound. For iOS, we ensure the notification is delivered with the default system sound (which it should already do).

### 2. Foreground (In-App)
The Web Audio API sounds should already work when the app is open. If they're not playing on mobile, it's likely due to **autoplay restrictions** -- mobile browsers require a prior user interaction in the same session before audio can play. The notification permission grant may not count.

**Fix**: Pre-warm the `AudioContext` on the first user interaction (tap) so subsequent programmatic plays are allowed.

### Changes

**`supabase/functions/care-reminder-push/index.ts`**
- Add `android_sound: "notification"` to the OneSignal payload to ensure the default Android notification sound plays
- Add `ios_sound: "default"` for iOS default sound
- Add `priority: 10` to ensure high-priority delivery

**`src/lib/alert-sounds.ts`**
- Add an `initAudioContext()` function that creates and resumes an `AudioContext` on first user tap, storing it for reuse
- Register a one-time `touchstart`/`click` listener to unlock audio playback on mobile

**`src/hooks/useCareNotifications.tsx`**
- Import and call `initAudioContext()` on mount so audio is ready when reminders fire

### Important Limitation
Custom dog-themed sounds will only play when the app is **in the foreground**. Background push notifications on mobile will use the device's default notification sound -- this is a platform limitation for PWAs that cannot be worked around.

