

## Two Changes: iOS Install Card on Me Tab + Privacy Toggle for Location

This plan covers both requests:
1. Adding an "iOS Install" prompt card to the bottom of the Me tab (based on the uploaded screenshot)
2. Securing `public_profiles` view and adding a privacy toggle for city/state visibility

---

### Part 1: iOS Install Prompt on the Me Tab

**What**: Add a static card at the bottom of the authenticated Me page that shows iOS PWA installation instructions (matching the uploaded screenshot style). This card will only appear on iOS devices that haven't installed the PWA yet, and can be dismissed.

**File: `src/pages/Me.tsx`**
- Import `isIOS`, `isStandalone` from `@/lib/navigation-utils` and `Share` from `lucide-react`
- Add a dismissible "Get Notifications on iPhone" card above the Sign Out button
- Uses the same detection logic as `NotificationPrompt` (`isIOS() && !isStandalone()`)
- Shows step-by-step instructions: tap Share, Add to Home Screen, tap Add
- Dismissible via localStorage (7-day suppression, same as existing prompt)
- Styled consistently with the app's card design (primary/10 icon background, rounded card)

---

### Part 2: Privacy Toggle and View Update

#### A. Database Migration: Update `public_profiles` View

Drop and recreate the `public_profiles` view to conditionally expose `city` and `state` based on a new `location_public` column on the `profiles` table.

```sql
-- Add location_public toggle column (defaults to true for existing users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_public boolean NOT NULL DEFAULT true;

-- Recreate public_profiles view: city/state only shown when location_public is true
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  display_name,
  username,
  avatar_url,
  bio,
  CASE WHEN location_public THEN city ELSE NULL END AS city,
  CASE WHEN location_public THEN state ELSE NULL END AS state,
  created_at
FROM profiles
WHERE is_public = true;
```

This ensures latitude and longitude are NEVER in the view (they already aren't), and city/state are conditionally hidden based on the user's preference.

#### B. Update Profile Type

**File: `src/types/index.ts`**
- Add `location_public: boolean;` to the `Profile` interface

#### C. Update EditProfileForm with Privacy Toggle

**File: `src/components/profile/EditProfileForm.tsx`**
- Add a `location_public` prop to the profile interface
- Add a Switch toggle labeled "Show my city/state publicly" beneath the city/state fields
- When toggled off, city/state are hidden from other users (friends-only visibility is handled by the view)
- Save the toggle value via `updateProfile`

#### D. Update useProfileManagement Hook

**File: `src/hooks/useProfileManagement.tsx`**
- Add `location_public` to the `ProfileData` interface so it can be saved

#### E. Update Me.tsx Profile Display

**File: `src/pages/Me.tsx`**
- Show a small "Location hidden" indicator if `profile.location_public === false`, so the user knows their location is private

---

### Summary of Files Changed

| File | Change |
|------|--------|
| **Database migration** | Add `location_public` column, recreate `public_profiles` view |
| `src/types/index.ts` | Add `location_public` to Profile type |
| `src/pages/Me.tsx` | Add iOS install card + location privacy indicator |
| `src/components/profile/EditProfileForm.tsx` | Add privacy toggle switch |
| `src/hooks/useProfileManagement.tsx` | Add `location_public` to ProfileData |

