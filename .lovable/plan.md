

## Fix Snooze Not Working

### Root Cause

The snooze is fundamentally broken because of a timing mismatch:

1. **Snooze sets `snoozed_until` to 15 minutes from now** — e.g., if reminder fires at 10:00, snooze sets expiry to 10:15.
2. **The check loop only triggers when `reminderHHMM === currentHHMM`** — it matches `reminder_time` (10:00) against the current clock time.
3. **After snooze expires at 10:15, `currentHHMM` is "10:15" but `reminderHHMM` is still "10:00"** — they no longer match, so the reminder never re-fires.

The snooze effectively silences the reminder permanently until the next day.

Additionally, on native iOS, pre-scheduled local notifications ignore snooze entirely since they're set at the original time during app startup.

### Plan

**File: `src/hooks/useCareNotifications.tsx`** — Fix the check loop to also trigger reminders whose snooze has just expired:

- After the existing `reminderHHMM === currentHHMM` check, add a second condition: if a reminder has `snoozed_until` set, and the snooze expiry falls within the current minute (i.e., snooze just expired), treat it as a triggered reminder regardless of the original `reminder_time`.
- Use a trigger key that includes the snooze expiry time to prevent duplicate firing.
- When rescheduling native local notifications, skip snoozed reminders and schedule a notification at the `snoozed_until` time instead of the original `reminder_time`.

**File: `src/hooks/useCareReminders.tsx`** — After a successful snooze, also clear the `triggeredIdsRef` key so the reminder can re-fire (this is already partially handled by `clearTriggeredReminder` in the UI, but the ref isn't cleared).

**File: `supabase/functions/care-reminder-push/index.ts`** — The edge function already skips snoozed reminders correctly, but it never re-checks them after snooze expires. Add logic to also fire reminders whose `snoozed_until` minute matches the current local time.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCareNotifications.tsx` | Add snooze-expiry trigger logic to check loop; fix native local notification scheduling for snoozed reminders |
| `supabase/functions/care-reminder-push/index.ts` | Add snooze-expiry matching so server-side push also re-fires after snooze |

