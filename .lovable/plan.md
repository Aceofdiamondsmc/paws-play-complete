

## Problem

Native iOS users (via Capacitor/Appflow) get a raw APNs device token stored in `onesignal_player_id`. But all Edge Functions (like-notification, comment-notification, message-notification, friend-request-notification) send push via OneSignal using `include_external_user_ids`, which only works if the device was registered with OneSignal and linked to that external user ID. Native users never call `OneSignal.login()`, so OneSignal has no record of them — push notifications silently fail.

## Solution

Register the native APNs token with OneSignal server-side so the existing Edge Functions work without any changes.

### 1. Create Edge Function `register-push-token`

A new Edge Function that:
- Authenticates the caller via JWT
- Accepts `{ token: string, device_type: "ios" | "android" }`
- Calls the OneSignal REST API to create/update a device player with:
  - `identifier`: the APNs token
  - `device_type`: 0 (iOS) or 1 (Android)
  - `external_user_id`: the authenticated Supabase user ID
  - `app_id`: the OneSignal App ID
- Returns success/failure

This links the raw APNs token to the user's Supabase ID inside OneSignal, making `include_external_user_ids` work for native users.

### 2. Update `NotificationPrompt.tsx`

In the native Capacitor registration path (line 66), after receiving the token:
- Call `supabase.functions.invoke('register-push-token', { body: { token: token.value, device_type: 'ios' } })`
- Keep the existing profile update (storing token in `onesignal_player_id`) as a fallback reference

No changes needed to any existing notification Edge Functions — they will continue using `include_external_user_ids` which will now resolve to the registered native device.

