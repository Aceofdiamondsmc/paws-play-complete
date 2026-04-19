
## Goal
Make foreign addresses (e.g. Martinique/France) work end-to-end across **Parks** and **Services** — from suggestion → admin approval → display → geocoding → navigation. Web-only changes, no native rebuild.

## What I found wrong

1. **`approve_park_suggestion` RPC drops `country` and `zip_code`.** The user form collects them, but when the admin approves, only `name, address, city, state…` are copied to `parks`. Result: a Martinique park lands with `country = NULL`, falls into the US-centric tier logic, and Mapbox geocoding has no country hint.

2. **`Park` TypeScript type and `useNearbyParks` mapping ignore `country`.** Even though the `parks` table has a `country` column, the app never reads it. So `ParkListItem`'s `formatLocation(city, state, country)` always gets `undefined` for country → "Fort-de-France, Martinique" instead of "Fort-de-France, Martinique, France".

3. **`AdminParks` create/edit form has no Country, ZIP, or Country Combobox.** Admin can't fix or add foreign parks manually. Also no lat/lng coords field on create — for foreign parks where geocoding is iffy, admin needs a manual override.

4. **`geocode-parks` edge function** already includes country in the Mapbox query (good) but only runs for parks with non-null `address`. The Martinique park likely has `address = NULL` (just name + city + region). Needs a fallback to query by `name + city + region + country` when address is missing.

5. **Navigation fallback** (`openNavigationByAddress`) uses `name + city + state` only — no country. For foreign parks, Google/Apple Maps may resolve to the wrong continent. Add country to the query string.

6. **`ParkPreviewSheet` location line** uses `[city, state]` only — no country shown.

## Fix plan (5 files, all web)

### 1. `supabase/migrations/<new>.sql` — Fix the RPC
Update `approve_park_suggestion` to also copy `country` and `zip_code` from suggestion → parks row.

### 2. `src/types/index.ts` — Add `country` and `zip_code` to `Park` interface.

### 3. `src/hooks/useNearbyParks.tsx` — Map `row.country` and `row.zip_code` into the `Park` object so the UI can read them.

### 4. `src/pages/admin/AdminParks.tsx`
- Add `country` (CountryCombobox), `zip_code`, `latitude`, `longitude` fields to the create/edit dialog.
- Include them in the `parkData` insert/update payload.
- Pre-fill `country` when editing.

### 5. `src/components/parks/ParkPreviewSheet.tsx`
- Show full international location: `formatLocation(city, state, country)` instead of `[city, state].join(', ')`.

### 6. `src/lib/navigation-utils.ts` — Update `openNavigationByAddress` callers in `ParkListItem` and `ParkPreviewSheet` to append `country` to the search query so external maps resolve foreign parks correctly.

### 7. `supabase/functions/geocode-parks/index.ts`
- Loosen the filter: also pick up parks with NULL address but a city+country combo, build the query as `[name, city, state, country].filter(Boolean).join(', ')`. Re-deploys automatically.

## After deploy — adding "Parc Naturel Régional de la Martinique"

Two paths, both will now work:

**A) Via user Suggest Park modal** (already has country + region UX). Submit → admin approves → RPC now carries country → geocoder resolves with country bias → park appears with full "Fort-de-France, Martinique, France" label.

**B) Via Admin Parks "Add Park"** (after fix). Fill name + address + city + region + Country=France + optionally lat/lng. Save. Done.

For this specific park, recommended values:
- Name: `Parc Naturel Régional de la Martinique`
- City: `Fort-de-France` (HQ)
- Region: `Martinique`
- Country: `France` (Martinique is a French overseas region, ISO `fr` for Mapbox)
- Latitude: `14.6037`, Longitude: `-61.0594` (HQ coords — admin can paste directly in the new lat/lng fields)

## Risk
- Migration is additive (just rewrites the RPC body) — safe.
- Adding optional columns to the admin form is non-breaking for existing US parks.
- Geocoder change widens what gets processed but is rate-limited (50 per run) and only fills in NULLs — safe.

## What you do after I implement
Nothing native. Just refresh the preview. Then:
1. Go to **Admin → Parks → Add Park**.
2. Fill in the Martinique park with Country = France + the lat/lng above.
3. Save → it shows up in the parks list with "Fort-de-France, Martinique, France" and a working "Go" button.
