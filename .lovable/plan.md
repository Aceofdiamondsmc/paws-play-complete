

## Background Push Notifications for Care Reminders

### Current Problem

Care reminders (walk, feeding, medication, grooming, training) currently rely on **client-side polling** using the browser's native `Notification` API inside `useCareNotifications.tsx`. This only works while the app tab is actively open. When the user closes the app or locks their phone, no reminders fire.

### Solution

Create a **server-side cron job** that runs every minute, checks which reminders are due right now, and sends **OneSignal push notifications** to each user. This works even when the app is completely closed.

### Architecture

1. **New Edge Function**: `care-reminder-push` -- invoked every minute by `pg_cron`
2. **Cron Job**: A `pg_cron` schedule that calls the edge function once per minute
3. **Deduplication**: A new `care_reminder_sent_log` table to track which reminders have already fired today, preventing duplicate pushes

### Plan

#### 1. New Edge Function: `supabase/functions/care-reminder-push/index.ts`

- Query `care_reminders` for all enabled reminders where `reminder_time` matches the current minute (HH:MM)
- Skip reminders that are snoozed (`snoozed_until` is in the future)
- Skip reminders already sent today (checked against `care_reminder_sent_log`)
- For each due reminder, send a OneSignal push notification using the user's external ID
- Log the sent reminder to prevent duplicates
- Use category-specific titles and emojis (same as the client-side logic):
  - medication: "Time for [task_details]"
  - feeding: "Time to feed: [task_details]"  
  - walk: "Time to take your pup for a walk!"
  - grooming: "Grooming reminder: [task_details]"
  - training: "Training reminder: [task_details]"

#### 2. Database Migration: Deduplication Table + Cron Job

**New table**: `care_reminder_sent_log`
```sql
CREATE TABLE care_reminder_sent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL,
  sent_date date NOT NULL DEFAULT CURRENT_DATE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reminder_id, sent_date)
);
```

**Cron job** (via `pg_cron` + `pg_net`):
- Runs every minute (`* * * * *`)
- Calls the `care-reminder-push` edge function
- Includes the anon key in the Authorization header

**Daily cleanup** (optional second cron):
- Deletes rows from `care_reminder_sent_log` older than 2 days to keep the table small

#### 3. Config Update: `supabase/config.toml`

Add:
```toml
[functions.care-reminder-push]
verify_jwt = false
```

### Summary of Changes

| Change | Details |
|--------|---------|
| New edge function | `supabase/functions/care-reminder-push/index.ts` |
| New table | `care_reminder_sent_log` (deduplication) |
| Cron job | `pg_cron` schedule every minute to invoke the function |
| Cleanup cron | Daily purge of old sent logs |
| Config | Add `care-reminder-push` to `config.toml` |

### What This Fixes

- Reminders will fire as push notifications even when the app is closed or the phone is locked
- The existing in-app browser notifications continue to work as a fallback when the app is open
- No changes needed to `useCareNotifications.tsx` -- the client-side logic remains for the in-app alert UI (Log Activity / Snooze buttons)

