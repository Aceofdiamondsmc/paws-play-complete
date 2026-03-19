

## Vet Visit Log — Resolving Category Conflict

### The Conflict

The Care Schedule already has a `vet_visit` category used for quick reminders (e.g., "Annual vaccines, Dr. Smith"). The new Vet Visit Log is a richer, structured feature with dog selection, clinic name, visit type, and vaccination linking. Using the same name would confuse users.

### Solution: Rename the Care Schedule category to "Clinic / Urgent"

- Rename the existing `vet_visit` category in the Care Schedule dropdown to **"Clinic / Urgent"** — this repositions it as a quick reminder for unplanned or urgent vet trips (sick visits, emergencies, follow-ups)
- The new **Vet Visit Log** section becomes the primary place for structured, planned vet visit tracking with yearly recurrence and vaccination auto-linking

This gives each feature a distinct purpose:

```text
┌─────────────────────────────────┬──────────────────────────────────────┐
│  Care Schedule: "Clinic/Urgent" │  Vet Visit Log (new section)         │
├─────────────────────────────────┼──────────────────────────────────────┤
│  Quick reminder with time       │  Full log: dog, clinic, visit type   │
│  "Pick up meds at 3pm"         │  "Annual Checkup at PetVet Clinic"   │
│  "Emergency follow-up tomorrow" │  Yearly recurrence for annual visits │
│  One-time or recurring          │  Auto-updates vaccination records    │
│  No dog or vaccination linking  │  Visit history with delete           │
└─────────────────────────────────┴──────────────────────────────────────┘
```

### Changes

**Database**
- New `vet_visits` table: `id`, `user_id`, `dog_id`, `visit_date`, `clinic_name`, `visit_type` (Annual Checkup / Vaccination / Sick Visit / Dental / Surgery / Other), `vaccination_types[]`, `notes`, `created_at`
- RLS: users manage own records (`user_id = auth.uid()`)

**`src/components/dates/CareScheduleSection.tsx`** — Rename only
- Change `vet_visit` display label from "Vet Visit" to "Clinic / Urgent"
- Update placeholder text to "e.g., Emergency follow-up, pick up meds"
- Update icon label and notification text accordingly
- Keep the `vet_visit` internal category value unchanged (no DB migration needed)

**`src/hooks/useCareNotifications.tsx`** — Update notification text
- Change "Vet Visit Reminder" to "Clinic / Urgent Reminder"

**`supabase/functions/care-reminder-push/index.ts`** — Update push text
- Change `vet_visit` notification title to "🏥 Clinic / Urgent Reminder"

**`src/hooks/useVetVisits.tsx`** (new)
- CRUD for `vet_visits` table
- `logVisit()`: inserts visit, then for each selected vaccination type either updates existing `vaccination_records` (set `expiry_date = visit_date + 1 year`, `status = 'verified'`) or inserts a new record
- Also logs to `care_history` with category `'vet_log'` for the activity feed

**`src/components/dates/VetVisitSection.tsx`** (new)
- Collapsible section on Dates tab with stethoscope icon
- "Log Vet Visit" form: dog selector (from user's dogs), visit date picker, clinic name input, visit type dropdown, multi-select checkboxes for common vaccinations (Rabies, DHPP, Bordetella, Leptospirosis, Canine Influenza, Lyme), notes field
- "Repeat Yearly" toggle that creates a `care_reminder` with `recurrence_pattern: 'yearly'` and `reminder_date` set to the visit date
- Visit history list showing past visits grouped by dog, with delete option

**`src/pages/Dates.tsx`**
- Import and render `VetVisitSection` between Care Schedule and Playdates sections

