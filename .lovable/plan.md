

## Plan: Lost Dog SOS, Rename Explore → Services, Group Playdates

Three features implemented together.

---

### Feature 1: Lost Dog Alert (App-Wide SOS)

**Database Migration:**
- New `lost_dog_alerts` table (id, user_id, dog_id, status, description, last_seen_location, lat/lng, contact_phone, post_id, created_at, resolved_at)
- RLS: owners manage their own alerts, all authenticated users can read active alerts

**New Edge Function: `lost-dog-alert/index.ts`**
- Creates a Social post with "[LOST DOG]" prefix + dog photo + location
- Sends push notification broadcast via OneSignal

**New Components:**
- `src/components/lost-dog/LostDogFAB.tsx` — Floating red pulsing SOS button (bottom-right, above bottom nav). Only visible to authenticated users with dogs.
- `src/components/lost-dog/LostDogAlertModal.tsx` — Multi-step: select dog → enter last seen location → description + phone → confirm & send
- `src/hooks/useLostDogAlerts.tsx` — createAlert, resolveAlert, activeAlerts queries

**Integration:**
- `AppLayout.tsx` — render `<LostDogFAB />`
- `Social.tsx` — lost dog posts appear at top with red "LOST DOG" banner; resolved ones show green "FOUND" badge

---

### Feature 2: Rename Explore → Services (Scissors icon)

- `BottomNav.tsx` — Change label "Explore" → "Services", icon `Compass` → `Scissors`
- `Explore.tsx` — Update header title and icon to match

Route stays `/explore` for URL stability.

---

### Feature 3: Group Playdates

**Database Migration:**
- `group_playdates` table (id, organizer_id, title, description, location_name, lat/lng, scheduled_date, scheduled_time, max_dogs, status, created_at)
- `group_playdate_rsvps` table (id, group_playdate_id, user_id, dog_id, status, created_at)
- RLS: all authenticated can read, organizers manage their own, users manage their own RSVPs

**New Components:**
- `src/components/playdate/CreateGroupPlaydateModal.tsx` — Form: title, location, date/time, max dogs, description
- `src/components/playdate/GroupPlaydateCard.tsx` — Card showing title, location, date, attendee avatars, count (e.g. "4/10 dogs"), Join CTA

**New Hook:** `src/hooks/useGroupPlaydates.tsx` — CRUD + RSVP operations

**Dates Tab Changes:**
- "+New" button becomes a dropdown: "1-on-1 Playdate" (existing flow) | "Group Playdate" (opens new modal)
- New "Group Playdates" section below existing playdate tabs showing upcoming group meetups

---

### Files Summary

| File | Action |
|------|--------|
| Database migration | `lost_dog_alerts`, `group_playdates`, `group_playdate_rsvps` tables |
| `supabase/functions/lost-dog-alert/index.ts` | New |
| `src/components/lost-dog/LostDogFAB.tsx` | New |
| `src/components/lost-dog/LostDogAlertModal.tsx` | New |
| `src/hooks/useLostDogAlerts.tsx` | New |
| `src/components/playdate/CreateGroupPlaydateModal.tsx` | New |
| `src/components/playdate/GroupPlaydateCard.tsx` | New |
| `src/hooks/useGroupPlaydates.tsx` | New |
| `src/components/layout/BottomNav.tsx` | Edit — Scissors icon, "Services" label |
| `src/pages/Explore.tsx` | Edit — header rename |
| `src/components/layout/AppLayout.tsx` | Edit — add LostDogFAB |
| `src/pages/Dates.tsx` | Edit — +New dropdown, group playdates section |
| `src/pages/Social.tsx` | Edit — lost dog banner posts |

