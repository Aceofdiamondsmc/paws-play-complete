

## Fix: Timezone-Aware Care Reminder Notifications

### Root Cause

The edge function `care-reminder-push` runs on the server in **UTC**. It compares the current UTC time against `reminder_time`, which is stored in the user's **local time**. So a reminder set for 8:30 AM Eastern fires when the server clock reads 08:30 UTC -- which is 3:30 AM Eastern. This is why you're getting a "Dog Walk Reminder" at 3:30 AM.

The client-side notifications (`useCareNotifications`) already work correctly because `format(now, 'HH:mm')` uses the browser's local clock. The problem is **only** in the server-side push function.

### Plan

#### 1. Database Migration -- Add `user_timezone` column

Add a timezone column to `care_reminders` so the server knows each user's timezone.

```sql
ALTER TABLE care_reminders
ADD COLUMN user_timezone text DEFAULT 'America/New_York';
```

Default is `America/New_York` so all existing reminders immediately work for Eastern time users.

#### 2. Update `src/hooks/useCareReminders.tsx` -- Save timezone on create

When creating a new reminder, automatically capture the browser's timezone:

- Use `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g., `"America/New_York"`)
- Include it in the insert payload as `user_timezone`
- Add `user_timezone` to the `CareReminder` interface

#### 3. Fix `supabase/functions/care-reminder-push/index.ts` -- Convert UTC to user's local time

Instead of comparing against raw UTC:

**Before (broken):**
```text
const currentHHMM = now.toTimeString().slice(0, 5); // UTC!
```

**After (fixed):**
```text
// For each reminder, convert current UTC time to the user's timezone
const userLocalTime = new Date(
  now.toLocaleString('en-US', { timeZone: reminder.user_timezone || 'America/New_York' })
);
const userHHMM = userLocalTime.toTimeString().slice(0, 5);
```

Also fix `today` date calculation to use the user's local date (not UTC date) for the sent-log dedup check.

Key changes to the edge function:
- Fetch `user_timezone` in the SELECT query
- Move the time-matching logic to compare per-reminder using the user's timezone
- Use user-local date for the `sent_date` dedup log

#### 4. Update `src/components/CareNotificationProvider.tsx` -- No changes needed

The context provider and client-side polling already work correctly since the browser uses local time. The global provider pattern is already in place from the previous fix.

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add `user_timezone` column to `care_reminders` |
| `src/hooks/useCareReminders.tsx` | Add `user_timezone` to interface; save browser timezone on insert |
| `supabase/functions/care-reminder-push/index.ts` | Convert UTC to user's local timezone before matching reminder times |

### Why This Fixes Both Issues

1. **Wrong time notifications**: The edge function will now correctly compare 8:30 AM Eastern against 8:30 AM Eastern (not 8:30 UTC)
2. **Background/all-tab support**: The server-side `pg_cron` job already runs every minute regardless of whether the app is open. Once the timezone logic is fixed, push notifications via OneSignal will arrive at the correct time even when the app is closed or on any tab.

