

## Three Changes for Paws Play Repeat

### 1. Replace Header Logo with New App Icon

**Current**: Header uses `src/assets/pawsplay-logo.png` (a text-style logo).
**Change**: Also display the new app icon from `public/favicon.png` (or `public/icon-192.png`) in the header, or replace the logo entirely with the new icon. Since the logo is a branded text image, the best approach is to keep the logo but ensure the favicon/tab icon references are correct.

**Clarification needed**: By "icon on the top of my tabs," do you mean the browser tab favicon, or the header bar logo inside the app? The favicon references in `index.html` already point to `public/favicon.png`. If you mean the in-app header, I'll swap or add the new icon there.

**Assumption**: You mean the browser tab / PWA icon. I'll verify `index.html` has correct favicon references to the updated `public/favicon.png`.

### 2. Add Months Option for Puppy Age in Dog Profile Form

**File**: `src/components/profile/PackMemberForm.tsx`

- Add a new state `ageUnit` (`'years'` | `'months'`) defaulting to `'years'`
- Replace the single "Age (years)" input with a row containing the number input + a toggle/select for years vs months
- On save, convert months to fractional years for storage (e.g., 6 months = 0.5 years) since `age_years` is a numeric column, OR store months as-is if under 1 year
- When editing, detect if `age_years < 1` and auto-set unit to months with the converted value

**Storage approach**: Store as decimal in `age_years` (e.g., 0.5 for 6 months). Display logic will convert back.

### 3. Show Dog's Age on Pack Tab Card

**File**: `src/pages/Pack.tsx`

- Add an age display in the dog profile card, in the 3-column grid (Size / Energy / Breed) — either replace one or add a 4th card
- Best approach: add an "Age" card to the grid, making it a 2x2 grid of 4 cards
- Calculate age from `date_of_birth` if available, otherwise use `age_years`
- Display as "X yrs" or "X mos" for puppies under 1 year

### Changes Summary

| File | Change |
|---|---|
| `index.html` | Verify favicon links point to updated icons |
| `src/components/profile/PackMemberForm.tsx` | Add years/months toggle for age input; convert on save/load |
| `src/pages/Pack.tsx` | Add Age card to the stats grid; compute from DOB or age_years |
| `src/types/index.ts` | No changes needed (age_years already numeric) |

