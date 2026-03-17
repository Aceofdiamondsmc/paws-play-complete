

## Plan: Date-Specific Vet Visit Reminders + Dog Birthday System

### Problem
The current care reminder system only supports recurring reminders (daily/weekly) with a time-of-day field. There is no way to schedule a one-time event on a specific date (e.g., "vet checkup on April 15th"). Additionally, the `dogs` table has no birthday field, so there is no birthday tracking or celebration logic anywhere in the app.

### Solution Overview

Two new features that integrate naturally into the existing Care Schedule and broader app:

1. **Date-specific reminders** -- new categories `vet_visit` and `birthday`, plus a `reminder_date` column so reminders can fire on a specific calendar date rather than every day
2. **Dog birthday system** -- a `date_of_birth` column on `dogs`, birthday auto-reminders, a birthday badge/banner across the app, and a confetti celebration on the dog's birthday

---

### Database Changes

**Migration 1: Add `reminder_date` to `care_reminders`**
```sql
ALTER TABLE public.care_reminders
  ADD COLUMN reminder_date date DEFAULT NULL;
```
This column is null for recurring reminders (existing behavior unchanged) and set for one-time date-specific reminders.

**Migration 2: Add `date_of_birth` to `dogs`**
```sql
ALTER TABLE public.dogs
  ADD COLUMN date_of_birth date DEFAULT NULL;
```

No new RLS policies needed -- existing policies already cover these tables.

---

### Frontend Changes

#### 1. `CareScheduleSection.tsx` -- Vet Visit + Birthday categories & date picker

- Add two new categories to the category dropdown: **Vet Visit** (Stethoscope icon) and **Birthday** (Cake icon)
- When `vet_visit` or `birthday` is selected, show a **date picker** (using the existing shadcn Calendar/Popover components) instead of the recurrence toggle
- The recurrence toggle hides; `is_recurring` is set to `false` and `recurrence_pattern` to `"once"`
- The `reminder_date` is included in the insert payload
- Task details placeholder updates contextually (e.g., "e.g., Annual vaccines, Dr. Smith" for vet visits)

#### 2. `useCareReminders.tsx` -- Support `reminder_date`

- Update `CareReminder` interface to include `reminder_date: string | null`
- Update `addReminder` to accept an optional `reminder_date` parameter and include it in the insert

#### 3. `CareNotificationProvider.tsx` -- No structural changes needed (passes through)

#### 4. Active Reminders display -- Show date for date-specific reminders

- In the reminders list, show the formatted date (e.g., "Apr 15") alongside the time for date-specific reminders
- Show "Once" badge instead of "Daily"/"Weekly"

#### 5. `care-reminder-push/index.ts` -- Date-aware matching

- When `reminder_date` is not null, only fire on that specific local date (compare `reminder_date` to the user's current local date)
- When `reminder_date` is null, use existing recurring logic (fires every day at the matching time)
- Add vet_visit and birthday to `getNotificationContent()`

#### 6. `PackMemberForm.tsx` -- Add birthday date picker

- Add a "Date of Birth" date picker field (optional) using the shadcn Popover + Calendar pattern
- Save to the new `date_of_birth` column on the `dogs` table
- Also show in edit mode, pre-populated if already set

#### 7. `useDogs.tsx` -- Include `date_of_birth` in insert/update

- Add `date_of_birth` to the `DogData` interface and the insert/update payloads

#### 8. Birthday Features Across the App

**Birthday Banner on Social tab** -- When any of the user's dogs has a birthday today, show a celebratory banner at the top of the Social feed: "🎂 Happy Birthday, [DogName]! 🎉" with the existing confetti burst animation (reuse from `ConfettiBurst`).

**Birthday Badge on Pack tab** -- Show a small cake emoji badge next to dogs whose birthday is today in the Pack dog list.

**Auto-create birthday reminder** -- When a user sets a dog's `date_of_birth`, automatically create a care reminder for that date annually (category: `birthday`, recurrence: `yearly`, with the dog's name in `task_details`). This uses the existing reminder infrastructure so they get a push notification on the morning of the birthday.

---

### Edge Function Changes

**`care-reminder-push/index.ts`**:
- Add `reminder_date` to the select query
- Filter logic: if `reminder_date` is set, only match when `reminder_date === localDateStr`; if null, match every day (existing behavior)
- Add yearly recurrence support: for `recurrence_pattern === 'yearly'`, match when the month and day of `reminder_date` equal the current local month/day
- Add notification content for `vet_visit` and `birthday` categories

---

### Summary of Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/` | 2 migrations: `reminder_date` on `care_reminders`, `date_of_birth` on `dogs` |
| `src/hooks/useCareReminders.tsx` | Add `reminder_date` to interface and `addReminder` |
| `src/components/dates/CareScheduleSection.tsx` | Add vet_visit/birthday categories, date picker, yearly recurrence option |
| `supabase/functions/care-reminder-push/index.ts` | Date-aware matching, yearly support, new notification content |
| `src/components/profile/PackMemberForm.tsx` | Add date of birth picker |
| `src/hooks/useDogs.tsx` | Include `date_of_birth` in DogData |
| `src/types/index.ts` | Add `date_of_birth` to Dog type |
| `src/pages/Social.tsx` | Birthday banner with confetti |
| `src/pages/Pack.tsx` | Birthday badge on dogs list |

