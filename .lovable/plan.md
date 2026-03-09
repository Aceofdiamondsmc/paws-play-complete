

## Plan: User Park Suggestions with Admin Approval

### Concept
Create a `park_suggestions` table where authenticated users can submit parks they'd like to see listed. These submissions sit in a "pending" state until an admin reviews and either approves (promoting to the `parks` table) or rejects them. Users get a simple submission form; admins get a review queue.

### Database

**New table: `park_suggestions`**
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, not null)
- `name`, `address`, `city`, `state`, `description` (text fields)
- `latitude`, `longitude` (double precision, nullable)
- `image_url` (text, nullable)
- `is_fully_fenced`, `has_water_station`, `has_small_dog_area`, `has_large_dog_area`, `has_agility_equipment`, `has_parking`, `has_grass_surface` (booleans, default false)
- `status` (text, default `'pending'` — values: `pending`, `approved`, `rejected`)
- `admin_notes` (text, nullable — reason for rejection)
- `created_at`, `reviewed_at` (timestamps)

**RLS policies:**
- Users can INSERT their own suggestions (`user_id = auth.uid()`)
- Users can SELECT their own suggestions (to see status)
- Admins can SELECT all, UPDATE status (approve/reject), DELETE

### Frontend Changes

**1. `src/pages/Parks.tsx`** — Add a "Suggest a Park" button
- Floating or in the header area, opens a modal/sheet with a form for name, address, city, state, and optional amenity toggles.
- On submit, inserts into `park_suggestions` with `status = 'pending'`.
- Success toast: "Thanks! Your suggestion is under review."

**2. New: `src/components/parks/SuggestParkModal.tsx`**
- Form with fields: name (required), address, city, state, description, and amenity switches matching the parks table schema.
- Uses the same amenity toggle pattern as AdminParks for consistency.

**3. `src/pages/admin/AdminParks.tsx`** — Add a "Pending Suggestions" tab/section
- Query `park_suggestions` where `status = 'pending'`.
- Each suggestion shows submitter info, park details, and Approve/Reject buttons.
- **Approve**: copies all fields into the `parks` table, sets suggestion `status = 'approved'`.
- **Reject**: sets `status = 'rejected'`, optionally with `admin_notes`.

**4. `src/hooks/useParkSuggestions.tsx`** — New hook
- `submitSuggestion(data)` — insert into `park_suggestions`
- `fetchPendingSuggestions()` — admin use
- `approveSuggestion(id)` — copies to `parks`, updates status
- `rejectSuggestion(id, notes?)` — updates status

### User Flow

```text
User on Parks page
  → Taps "Suggest a Park" button
  → Fills in name + location details + amenities
  → Submits → toast "Suggestion submitted for review!"

Admin on Admin Parks page
  → Sees "Pending (3)" badge on suggestions tab
  → Reviews details → Approve or Reject
  → Approve copies data to parks table
```

### No existing table changes
The `parks` table is untouched. Approved suggestions get inserted as new rows in `parks` by the admin action.

