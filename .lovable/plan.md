

## Minimize Profile Data Exposure

### Problem
Multiple hooks fetch `select('*')` from profiles, pulling more data than needed. The Social feed should only request display names and avatars.

### Changes

**1. `src/hooks/usePosts.tsx`** (Social Feed) — 3 locations
- Change all `profiles_safe` queries from `select('*')` to `select('id, display_name, avatar_url')`
- Lines ~58, ~127, ~365

**2. `src/hooks/useMessages.tsx`**
- Change `select('*')` to `select('id, display_name, avatar_url')` (messages only need name + avatar for chat headers)

**3. `src/hooks/useFriendships.tsx`**
- Change `select('*')` to `select('id, display_name, username, full_name, avatar_url, city, state')` (friendship cards show location info)

**4. `src/hooks/usePlaydates.tsx`**
- Change `select('*')` to `select('id, display_name, username, full_name, avatar_url, city, state')` (playdate matching shows location)

**5. `src/pages/Pack.tsx`**
- Change `select('*')` to `select('id, display_name, avatar_url, city, state')` (Pack discovery cards)

**6. `src/pages/admin/AdminSocial.tsx`** — already scoped to `select('id, display_name, username, full_name')`, no change needed.

**7. `src/hooks/useAuth.tsx`** — keep `select('*')` from `profiles` table since this is the logged-in user fetching their own full profile (needed for settings, onboarding status, location, etc.). No change needed.

### What stays the same
- The `profiles_safe` view definition (already excludes GPS and tokens)
- All RLS policies
- The `useAuth` hook (own-profile fetch)
- All update/insert queries against `profiles`

### Impact
No UI changes — all components already only use the fields being selected. This just stops over-fetching unused sensitive-adjacent data.
