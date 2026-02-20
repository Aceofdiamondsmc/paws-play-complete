
## Fix: Send Test Push Notification — OneSignal Payload Missing `channel_for_external_user_ids`

### Root Cause (Confirmed)

The edge function is getting past auth (401/403 are not the issue) and is actually calling OneSignal — but OneSignal returns an error that the function forwards as a **502**. The function code is otherwise correct.

The problem is the OneSignal notification payload is missing a required field: **`channel_for_external_user_ids`**.

When using `include_external_user_ids` to target users by their external (Supabase UUID) identity, OneSignal requires you to also specify **which channel** to deliver the notification on. Without it, OneSignal rejects the request with an error.

The OneSignal documentation (confirmed via research) states:

> "When targeting users by external ID, you must include `channel_for_external_user_ids: 'push'` to specify the delivery channel."

### The Fix

One small addition to the payload in `supabase/functions/send-test-notification/index.ts`:

**Current (broken) payload:**
```typescript
const oneSignalPayload = {
  app_id: ONESIGNAL_APP_ID,
  include_external_user_ids: [targetUserId],
  contents: { en: body },
  headings: { en: title },
  data: data || {},
};
```

**Fixed payload:**
```typescript
const oneSignalPayload = {
  app_id: ONESIGNAL_APP_ID,
  include_external_user_ids: [targetUserId],
  channel_for_external_user_ids: 'push',   // ← required field
  contents: { en: body },
  headings: { en: title },
  data: data || {},
};
```

### Why This Is the Root Cause

- The edge function returns **502** (not 401/403) — proving auth and admin checks pass fine
- The function then calls OneSignal, which rejects the payload and returns an error
- The function forwards that error as a 502 response
- The fix has been confirmed via OneSignal's API docs and community research: `channel_for_external_user_ids: 'push'` is required when targeting by external user ID

### Files to Change

| File | Change |
|---|---|
| `supabase/functions/send-test-notification/index.ts` | Add `channel_for_external_user_ids: 'push'` to the OneSignal payload |
| `supabase/functions/comment-notification/index.ts` | Same fix — add `channel_for_external_user_ids: 'push'` to its payload too |

### No Other Changes Needed

- Auth logic (`getUser`) is correct — already fixed in the previous round
- OneSignal API URL (`https://api.onesignal.com/notifications`) is correct
- Authorization header (`Key <key>`) is correct
- `ONESIGNAL_REST_API_KEY` secret is configured
- `OneSignal.login(userId)` in `useAuth.tsx` correctly links each user's Supabase UUID as their OneSignal `external_id` — so targeting by UUID is valid
- The Admin Tools UI does not need changes

### After the Fix

Both functions will be redeployed. To test:
1. Go to Admin Tools → Send Test Push Notification
2. Enter your user UUID and hit "Send Push Notification"
3. You should receive a push notification on your device
