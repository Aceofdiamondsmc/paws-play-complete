
User wants international support. Two concrete asks:
1. **Sign-ups** — accommodate foreign users (city/state fields are US-centric)
2. **Parks & Services addresses** — handle non-US addresses like "Parc Naturel Régional de la Martinique" (Martinique = French overseas region, no US state, different postal format)

Let me check what's currently US-centric:
- `OnboardingProfileSetup.tsx` shows: City "e.g., Las Vegas" + State "e.g., NV" → US-only UX
- `geocode-parks/index.ts` hard-codes `&country=US` in Mapbox geocoding → blocks all foreign parks
- `park_suggestions` table has `city`, `state`, `zip_code` — all text, no `country`
- `parks` table same: `city`, `state`, `zip_code` — no `country`
- `service_submissions` has `city`, `state` — no `country`
- Profiles likely same (city/state text fields)

The Martinique example is perfect: it's France, no "state", postal codes are 5-digit French format (97250), and `country=US` filter in geocode-parks would reject it entirely.

## Plan

### 1. Database: add `country` everywhere
Migration to add nullable `country text` (ISO display name like "France", "United States") to:
- `profiles`
- `parks`
- `park_suggestions`
- `services`
- `service_submissions`

Default existing rows to `'United States'` (since current data is US).

### 2. Geocoding: remove hard US filter
`supabase/functions/geocode-parks/index.ts` — drop `&country=US`, let Mapbox return global results. Optionally accept a `country` param to bias results when known.

For **new park suggestions**, geocode using full address including country so Mapbox finds international locations correctly.

### 3. UI: replace State with Region + add Country
Add a lightweight **Country selector** (searchable Combobox, ~250 ISO countries) and rename "State" → "State / Region / Province" with a free-text input (no enum — too many regional variations globally).

Apply to:
- `OnboardingProfileSetup.tsx` (sign-up)
- `EditProfileForm.tsx` (profile edit)
- `SuggestParkModal.tsx` (park submission)
- `SubmitService.tsx` (service submission)
- Admin edit modals for parks/services

Default country to **United States** to preserve current UX, but let users change it. Detect from browser locale (`navigator.language`) as smart default for new users.

### 4. Address field guidance
Update placeholders contextually:
- US selected → "City: Las Vegas", "State: NV", "ZIP: 89101"
- Non-US → "City: Fort-de-France", "Region: Martinique", "Postal code: 97250"

### 5. Display logic
Park/service cards currently show `"city, state"`. Update to:
- US: `"Las Vegas, NV"`
- Non-US: `"Fort-de-France, Martinique, France"` (city, region, country)

Helper `formatLocation(city, state, country)` in `src/lib/utils.ts`.

### 6. Distance calculations
Already use lat/lng (Haversine + PostGIS) — **no changes needed**. Once geocoded, international parks plot correctly on the Mapbox map and sort by distance just like US parks.

### 7. Phone numbers (optional, low priority)
Service submissions have `phone` — currently free-text, so already works internationally. Skip unless user wants intl-tel-input picker.

### Technical summary
- 1 DB migration (5 columns added)
- 1 edge function edit (remove country lock)
- 1 new component: `CountryCombobox.tsx` (using existing shadcn Command + Popover)
- 4-5 form edits (onboarding, profile, suggest park, submit service, admin edits)
- 1 utility: `formatLocation()`
- Display tweaks in `ParkCard`, `ParkListItem`, service list items

### Specifically for "Parc Naturel Régional de la Martinique"
After this lands, you'd open **Suggest a Park** → Country: `France`, Region: `Martinique`, City: `Fort-de-France` (or wherever HQ is), Address: full street line. Geocoder returns proper coords, park plots on map, distance calculates from any user worldwide.

### Out of scope (call out)
- App UI translation (i18n) — still English-only. International users *use* the app in English; UI strings aren't translated. Separate larger effort if you want that later.
- Currency for paid service tiers — Stripe/IAP stay USD.
- Time zones — already stored per user via `user_timezone` in `care_reminders`.
