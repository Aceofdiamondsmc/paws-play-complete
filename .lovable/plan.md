

## Resync Types and Remove `full_name` References

The `full_name` column has been dropped from the `profiles` table. A no-op migration will trigger `types.ts` regeneration, and all code references to `full_name` need to be cleaned up.

### Files to Update

| File | Change |
|---|---|
| New no-op migration | Triggers `types.ts` regeneration to remove `full_name` from profile types |
| `src/types/index.ts` | Remove `full_name` from the `Profile` interface (line 37) |
| `src/pages/admin/AdminSocial.tsx` | Remove `full_name` from the `Profile` interface (line 48), remove it from the `public_profiles` select query (line 82), and remove it from the `getAuthorName` fallback chain (line 109) |
| `src/pages/Social.tsx` | Remove `full_name` from the author name fallback chain (line 296) |
| `src/hooks/usePlaydates.tsx` | Remove `full_name` from the `public_profiles` select query (line 53) |
| `src/hooks/useFriendships.tsx` | Remove `full_name` from the `public_profiles` select query (line 41) |
| `src/components/profile/OnboardingProfileSetup.tsx` | Replace `profile?.full_name?.[0]` fallback with `'?'` in the avatar fallback (line 89) |

### Details

- **Name fallback chains** like `display_name \|\| username \|\| full_name \|\| 'Anonymous'` will become `display_name \|\| username \|\| 'Anonymous'`
- **Select queries** like `.select('id, display_name, full_name, avatar_url')` will drop the `full_name` field
- The auto-generated `types.ts` will be refreshed by the no-op migration to reflect the current schema

### No Other Changes Needed

- All write operations (profile updates, post creation) do not reference `full_name`
- The `public_profiles` and `public_posts` views will be regenerated server-side by Supabase since the column was dropped with CASCADE

