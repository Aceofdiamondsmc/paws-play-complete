
## Fix: Send Test Push Notification — OneSignal API Migration

### Root Cause (Confirmed)

The `send-test-notification` edge function is calling a **deprecated OneSignal API** that was shut down in early 2025. Two things are wrong:

1. **Wrong URL**: The function calls `https://onesignal.com/api/v1/notifications` — this is the legacy v1 endpoint that has been deprecated since March 2025.
2. **Wrong auth header format**: The function sends `Authorization: Basic <key>` — OneSignal now requires `Authorization: Key <key>` for their new "rich API key" format.

The log history confirms this: the edge function was returning `502 Bad Gateway` because OneSignal was responding with `Access denied`.

### Fix

One file to update: `supabase/functions/send-test-notification/index.ts`

**Change the OneSignal API call from:**
```typescript
// Old - deprecated
const osResponse = await fetch('https://onesignal.com/api/v1/notifications', {
  headers: {
    Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
  },
});
```

**To:**
```typescript
// New - current as of 2025
const osResponse = await fetch('https://api.onesignal.com/notifications', {
  headers: {
    Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
  },
});
```

### Why No Other Changes Are Needed

- The `ONESIGNAL_REST_API_KEY` secret is already configured in Supabase (confirmed via secrets list).
- The `ONESIGNAL_APP_ID` hardcoded in the function (`47e18c4a-2002-4fec-9e3a-4984745e7cd5`) stays the same.
- The request body payload format (`app_id`, `include_external_user_ids`, `contents`, `headings`) remains valid in the new API.
- The `AdminTools.tsx` UI does not need changes — the client-side invocation is correct.

### After the Fix

The edge function will be redeployed automatically. To test:
1. Go to Admin Tools → Send Test Push Notification
2. Paste your own user UUID
3. Hit "Send Push Notification"
4. You should receive a push notification on your device

### Technical Summary

| Component | Was | Now |
|---|---|---|
| API URL | `https://onesignal.com/api/v1/notifications` | `https://api.onesignal.com/notifications` |
| Auth header | `Authorization: Basic <key>` | `Authorization: Key <key>` |
| Secret | `ONESIGNAL_REST_API_KEY` (already set) | No change |
| Payload body | Valid | No change needed |
