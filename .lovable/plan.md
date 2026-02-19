

## Admin Tools Page: Notification Testing and Install Preview

### Overview
Replace the placeholder "Admin Settings" page with a full-featured **Admin Tools** page containing three sections: Notification Diagnostics, Targeted Push Test, and Install Prompt Preview.

---

### Section 1: Notification Diagnostics (Local Device)

A card showing the current state of notifications on **your** device:

- **Permission Status**: Live display of `Notification.permission` (granted / denied / default) with a color-coded badge
- **OneSignal Status**: Whether OneSignal SDK is loaded and your current subscription ID
- **Test Local Notification**: A button that fires a browser `new Notification(...)` to confirm your device can receive alerts
- **Re-request Permission**: If permission is "default", show a button to trigger `Notification.requestPermission()`

---

### Section 2: Targeted Push Notification Test (Send to Any User)

Send a real push notification to any user via OneSignal's REST API:

- **User Selector**: A text input for entering a `user_id` manually, plus a "Look Up User" button that queries the `profiles` table and shows the user's display name for confirmation
- **Notification Type Dropdown**: Choose from preset templates:
  - "Test Notification" (generic)
  - "Walk Reminder" (dog walk style)
  - "Medication Reminder" (medication style)
  - "Feeding Reminder" (feeding style)
- **Custom Message**: Optional text input to override the default message
- **Send Button**: Calls a new Edge Function `send-test-notification` that uses the OneSignal REST API with `include_external_user_ids` to push to the specified user
- **Result Display**: Shows success/failure response from OneSignal

#### New Edge Function: `supabase/functions/send-test-notification/index.ts`
- Accepts `{ targetUserId, title, body, data }` in the request body
- Requires JWT auth and verifies the caller is an admin (checks `admin_users` table)
- Sends push via OneSignal REST API using the existing `ONESIGNAL_REST_API_KEY` secret
- Returns the OneSignal API response for debugging

---

### Section 3: Install Prompt Preview

A card with a toggle switch: **"Force Show Install Instructions"**

- When toggled ON, renders the `NotificationPrompt` component's iOS and Standard prompt UIs inline (not as a fixed overlay) so you can preview exactly how they look
- Shows both variants side-by-side: the standard "Enable Notifications" prompt and the iOS "Add to Home Screen" instructions
- Also displays device detection info: `isIOS()`, `isStandalone()`, `isAndroid()` results as badges so you can verify detection logic

---

### Technical Details

#### Files to Create
- `src/pages/admin/AdminTools.tsx` -- New page with all three sections
- `supabase/functions/send-test-notification/index.ts` -- Edge function for targeted push

#### Files to Modify
- `src/components/admin/AdminLayout.tsx` -- Add "Tools" nav item (Wrench icon)
- `src/App.tsx` -- Add `/admin/tools` route
- `supabase/config.toml` -- Add `[functions.send-test-notification]` with `verify_jwt = false` (auth checked in code)

#### Edge Function Design
```
POST /send-test-notification
Body: { targetUserId: string, title: string, body: string, data?: object }

1. Verify JWT from Authorization header
2. Check caller's user_id exists in admin_users table
3. Send OneSignal notification with include_external_user_ids: [targetUserId]
4. Return OneSignal response JSON
```

#### AdminTools Page Structure
```
Admin Tools
  |-- Card: Notification Diagnostics
  |     |-- Permission badge (granted/denied/default)
  |     |-- OneSignal status
  |     |-- [Test Local Notification] button
  |     |-- [Re-request Permission] button (if default)
  |
  |-- Card: Send Test Push
  |     |-- User ID input + [Look Up] button
  |     |-- User info display (name, avatar)
  |     |-- Notification type select (Test/Walk/Medication/Feeding)
  |     |-- Custom message input (optional)
  |     |-- [Send Push Notification] button
  |     |-- Result/error display
  |
  |-- Card: Install Prompt Preview
        |-- Device info badges (iOS/Android/Standalone)
        |-- Toggle: Force show prompts
        |-- Inline preview of Standard prompt
        |-- Inline preview of iOS prompt
```

