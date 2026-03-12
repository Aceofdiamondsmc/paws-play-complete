

## Three Changes

### 1. Fix Admin Park Suggestion Approval (RLS Error)

The `approveSuggestion` function in `useParkSuggestions.tsx` inserts into the `parks` table client-side. The `parks_insert_admin` RLS policy uses `is_admin()`, which should work — but the multi-step client logic is fragile. The fix is to create a `SECURITY DEFINER` database function that handles the entire approve flow server-side, bypassing RLS.

**Database migration**: Create `approve_park_suggestion(suggestion_id uuid)` function that:
- Verifies caller is in `admin_users`
- Fetches the suggestion
- Computes next park `Id`
- Inserts into `parks`
- Updates suggestion status to `'approved'`
- Raises exception if not admin or suggestion not found

**`src/hooks/useParkSuggestions.tsx`**: Replace the `approveSuggestion` method body with a single `supabase.rpc('approve_park_suggestion', { suggestion_id: id })` call, plus refresh afterward.

### 2. "Pack Friends" Filter on Social Tab

Currently the `filteredPosts` logic (line 305-307 in `Social.tsx`) returns all posts when `activeFilter === 'friends'` — no filtering happens.

**`src/pages/Social.tsx`**:
- Import `useFriendships`
- Extract accepted friend IDs into a `Set<string>` from `friends` array
- Update `filteredPosts`: when `activeFilter === 'friends'`, filter to posts where `post.author_id` is in the friend IDs set or is the current user's own ID
- No other changes to the Social tab

### 3. Profile Preview Popover on Pack Tab Avatar

The "Pack Leader" section at the bottom of the Pack tab (lines 620-749) shows the dog owner's avatar. Tapping it should open a small profile preview.

**`src/components/pack/UserProfilePopover.tsx`** (new file):
- Radix `Popover` wrapping children (the avatar)
- On open, fetches from `public_profiles` for the user ID (display_name, avatar_url, bio, city, state)
- Shows: avatar, name, city/state (if available), bio snippet
- "Message" button that navigates to chat
- Closes on outside click or tap

**`src/pages/Pack.tsx`**:
- Import `UserProfilePopover`
- Wrap the Pack Leader avatar/name area with `UserProfilePopover` (only for other users' dogs, not own)
- No changes to Social tab avatars

### Files Changed

| File | Change |
|------|--------|
| DB migration | `approve_park_suggestion` SECURITY DEFINER function |
| `src/hooks/useParkSuggestions.tsx` | Use RPC for approve |
| `src/pages/Social.tsx` | Friends filter logic via `useFriendships` |
| `src/components/pack/UserProfilePopover.tsx` | New profile preview popover |
| `src/pages/Pack.tsx` | Wrap Pack Leader avatar with popover |

