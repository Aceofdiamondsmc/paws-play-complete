

## Fix: "Meet Diamond" Navigates to Ace Instead

### Root Cause

When a post's `dog_id` is `null` (which is the case for Diamond's posts — they were likely created before `dog_id` support was added or via admin editing), the "Meet" button falls back to `/pack?user=${author_id}`. The Pack page then does `findIndex(d => d.owner_id === targetUserId)` which returns the **first** dog for that owner — Ace.

### Fix

Two changes:

| File | Change |
|------|--------|
| `src/pages/Social.tsx` | When `dog_id` is null but `dogName` exists, look up the matching dog ID from the fetched dogs data and use `/pack?dog=` instead of `/pack?user=`. Create a helper that resolves the correct navigation URL. |
| `src/hooks/usePosts.tsx` | When enriching posts, if `dog_id` is null but `pup_name` matches a known dog name, backfill `dog_id` from the dogs lookup so the "Meet" button always has the correct target. |

The `usePosts` fix is the cleaner approach — during post enrichment (line ~77), if `dog_id` is null but `pup_name` matches a dog in the database, set `dog_id` from that match. This fixes all three navigation points (avatar click, name click, Meet button) at once without changing Social.tsx navigation logic.

