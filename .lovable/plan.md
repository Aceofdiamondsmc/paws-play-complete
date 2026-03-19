

## Vet Visit Log with Vaccination Linking (DONE)

### What was implemented:

1. **New `vet_visits` table** — stores dog_id, visit_date, clinic_name, visit_type, vaccination_types[], notes with RLS for user-owned records
2. **`useVetVisits` hook** — CRUD for vet visits, auto-updates `vaccination_records` expiry (+1 year) and status to `verified`, logs to `care_history`, and optionally creates yearly care reminders
3. **`VetVisitSection` component** — collapsible section on Dates tab with log form (dog selector, date, clinic, visit type, vaccination checkboxes, notes, yearly reminder toggle) and visit history list
4. **Renamed Care Schedule `vet_visit` → "Clinic / Urgent"** — updated in CareScheduleSection, useCareNotifications, and care-reminder-push Edge Function to avoid naming conflict

### Files created/modified:
- `src/hooks/useVetVisits.tsx` (new)
- `src/components/dates/VetVisitSection.tsx` (new)
- `src/pages/Dates.tsx` (modified — added VetVisitSection)
- `src/components/dates/CareScheduleSection.tsx` (modified — renamed label)
- `src/hooks/useCareNotifications.tsx` (modified — renamed notification text)
- `supabase/functions/care-reminder-push/index.ts` (modified — renamed push text)

---


## Add "Starter" Tier and Rename "Basic" to "Value"

### Overview
Add a new $9.99/month "Starter" tier (the lowest-priced option), rename "Basic" to "Value", and reorder all tiers from cheapest to most expensive.

### Stripe Setup (Done)
- Created Stripe product "Starter Listing" with price `price_1T4vr4FJz7YiRCGBNOix6uLP` ($9.99/month, recurring)

### Changes

**1. `src/pages/SubmitService.tsx`** -- Update `PRICING_TIERS` array

Reorder and update the tiers array to:
1. **Starter** -- $9.99/month (new) -- basic directory listing, searchable, contact info
2. **Value** -- $29.99 one-time (renamed from Basic) -- everything in Starter for a full year
3. **Featured** -- $19.99/month (unchanged) -- priority placement, badge
4. **Premium** -- $149.99/year (unchanged) -- top placement, verified

Also update `selectedTier` default from `'basic'` to `'starter'` and add a `Sparkles` icon import for the new tier.

**2. `supabase/functions/create-checkout-session/index.ts`** -- Add starter tier to PRICING map

Add `starter` entry with price ID `price_1T4vr4FJz7YiRCGBNOix6uLP`, mode `subscription`, and rename `basic` display name to "Value Listing".

**3. `src/hooks/useServiceSubmissions.tsx`** -- Update TypeScript types

Add `'starter'` to the `subscription_tier` union types in both `ServiceSubmission` and `SubmissionFormData` interfaces.

**4. Database migration** -- Update the `subscription_tier` column constraint

The `service_submissions` table likely has a check constraint limiting tier values to `basic`, `featured`, `premium`. Need to add `'starter'` as an allowed value.

### Tier Order (lowest to highest)

| Tier | Price | Billing |
|------|-------|---------|
| Starter | $9.99 | /month |
| Value | $29.99 | one-time |
| Featured | $19.99 | /month |
| Premium | $149.99 | /year |

---

## Lost Dog SOS, Rename Explore → Services, Group Playdates (DONE)

### What was implemented:

1. **Lost Dog SOS** — Floating red SOS button (LostDogFAB) on every tab for authenticated users with dogs. Opens a multi-step modal to report a lost dog, creates a public Social post, and sends OneSignal push notification broadcast. Lost dog alerts appear as banners at the top of the Social feed.

2. **Rename Explore → Services** — BottomNav now shows "Services" with Scissors icon. Explore page header updated to match.

3. **Group Playdates** — New "+New" dropdown on Dates page with "1-on-1 Playdate" and "Group Playdate" options. Group playdate creation modal, card component with RSVP functionality, and a dedicated section on the Dates page.

### Database tables created:
- `lost_dog_alerts` — tracks active/found/cancelled lost dog reports
- `group_playdates` — group playdate events with organizer, location, date/time, max dogs
- `group_playdate_rsvps` — RSVPs with user_id, dog_id, status

### Files created/modified:
- `src/hooks/useLostDogAlerts.tsx` (new)
- `src/hooks/useGroupPlaydates.tsx` (new)
- `src/components/lost-dog/LostDogFAB.tsx` (new)
- `src/components/lost-dog/LostDogAlertModal.tsx` (new)
- `src/components/playdate/CreateGroupPlaydateModal.tsx` (new)
- `src/components/playdate/GroupPlaydateCard.tsx` (new)
- `supabase/functions/lost-dog-alert/index.ts` (new)
- `src/components/layout/AppLayout.tsx` (edited — added LostDogFAB)
- `src/components/layout/BottomNav.tsx` (edited — Scissors icon, "Services" label)
- `src/pages/Explore.tsx` (edited — header rename)
- `src/pages/Dates.tsx` (edited — +New dropdown, group playdates section)
- `src/pages/Social.tsx` (edited — lost dog alert banners)
- `supabase/config.toml` (edited — added lost-dog-alert function)
