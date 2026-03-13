

## Fix: Auto-Geocode on Approval + ZIP Field + Backfill

### Root Cause
User-suggested parks have no latitude/longitude. The Map view geocodes them client-side on the fly, but the List view's 3-tier discovery logic can't compute distance without coordinates, so the park falls to Tier 3 (hidden behind "Show More") even though `added_by` should promote it to Tier 2.

There are two issues:
1. The `added_by` comparison fails because `parks.added_by` is stored as `text` but `user.id` is a UUID string -- checking the DB shows `added_by` = `'7ffea141-867a-4b38-b99f-62c7139c86cc'` which should match, so it's likely the null lat/lng causing the park to not get a distance, landing it in Tier 2 but without distance display.
2. More importantly, the park SHOULD appear because `added_by` promotion works, but it still has no coordinates for distance calculation. The real fix is to ensure coordinates are populated at approval time.

### Changes

#### 1. Add ZIP Code Field to Suggest Park Modal
**`src/components/parks/SuggestParkModal.tsx`**
- Add `zip_code` field to the form (optional)
- Add a ZIP code input between City/State and Description

**`src/hooks/useParkSuggestions.tsx`**
- Add `zip_code` to `ParkSuggestionInput` interface and insert logic

**Database migration**
- Add `zip_code text` column to `park_suggestions` table
- Add `zip_code text` column to `parks` table (for completeness)

#### 2. Auto-Geocode at Approval Time
**Update `approve_park_suggestion` RPC** to call a geocoding step. Since SQL can't make HTTP calls, we'll instead:

- Update the **`approve_park_suggestion`** RPC to insert the park as before
- Create a new **database trigger** or modify the **admin approval flow** in `AdminParks.tsx` to auto-geocode after approval

**Better approach**: Modify `handleApproveSuggestion` in `AdminParks.tsx` to:
1. Call `approveSuggestion(id)` (inserts park into parks table)
2. Immediately call the `geocode-parks` edge function to geocode any parks missing coordinates
3. Refresh the parks list

#### 3. Admin Suggestion Review: Show Lat/Lng Fields
**`src/pages/admin/AdminParks.tsx`** (suggestions tab)
- Add editable latitude/longitude inputs on each suggestion card before approving
- Allow admin to manually set coordinates before clicking Approve
- If admin sets coords, update the suggestion's lat/lng before calling approve RPC

#### 4. Backfill Existing Parks
**`src/pages/admin/AdminTools.tsx`** (or AdminParks)
- Add a "Geocode Missing Parks" button that calls the existing `geocode-parks` edge function
- This already exists in the codebase; we just need to make sure admins can trigger it from the UI

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Add `zip_code` to `park_suggestions` and `parks` tables |
| `src/components/parks/SuggestParkModal.tsx` | Add optional ZIP code field |
| `src/hooks/useParkSuggestions.tsx` | Add `zip_code` to input type and insert |
| `src/pages/admin/AdminParks.tsx` | Add lat/lng inputs on suggestion cards; auto-geocode after approval |

