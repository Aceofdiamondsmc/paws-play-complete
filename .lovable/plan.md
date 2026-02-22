

## Fix: Likes Counting by Two

### Root Cause

The `usePosts` hook has **two independent systems** both updating the like count simultaneously:

1. **Optimistic update** in `likePost()` (lines 268-294): After the Supabase insert/delete succeeds, it immediately updates local state with `likesCount + 1` or `likesCount - 1`.

2. **Realtime subscription** on `post_likes` (lines 148-175): Listens for INSERT/DELETE events on `post_likes` and also applies `likesCount + 1` or `likesCount - 1`.

Both fire for the same action, so every like/unlike changes the count by 2.

### The Fix

**File: `src/hooks/usePosts.tsx`**

In the realtime subscription handler for `post_likes`, skip the count update when the event was triggered by the current user (since `likePost` already handled it optimistically):

- On INSERT: if `newLike.user_id === currentUserId`, skip the `likesCount + 1` (already done)
- On DELETE: if `oldLike.user_id === currentUserId`, skip the `likesCount - 1` (already done)

This keeps the realtime subscription working for likes from **other users** (so the feed updates live) while preventing the double-count for the current user's own actions.

Additionally, add a guard to `likePost` to prevent rapid double-taps:
- Track an in-flight state per post ID
- If a like/unlike is already in progress for that post, return early

### Technical Details

| Change | Detail |
|--------|--------|
| `src/hooks/usePosts.tsx` realtime handler | Skip count update when `user_id` matches current user |
| `src/hooks/usePosts.tsx` likePost | Add in-flight guard using a `Set<string>` ref to prevent double-tap race conditions |

### Single File Changed

Only `src/hooks/usePosts.tsx` needs to be modified -- no UI changes required.

