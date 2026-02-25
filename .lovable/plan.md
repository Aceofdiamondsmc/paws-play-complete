
I investigated the current implementation and found the root cause is no longer RLS.

## What I found

1. `posts` DELETE policies are currently **PERMISSIVE** in the live database (`posts_delete_own`, `posts_delete_admin`), so policy logic is not blocking deletes.
2. There is a `BEFORE DELETE OR UPDATE` trigger on `posts`:
   - Trigger: `posts_video_delete_storage_trigger`
   - Function: `cleanup_post_video_storage()`
3. In `cleanup_post_video_storage()`, this logic exists:
   - If `TG_OP = 'DELETE'` **and** `OLD.video_url IS NOT NULL` → `RETURN OLD` (delete proceeds)
   - Otherwise for DELETE rows with `video_url IS NULL`, it falls through to `RETURN NEW`
4. In a `BEFORE DELETE` trigger, `NEW` is null. Returning null **cancels the delete silently**.
5. Most posts have `video_url IS NULL` (41/42 in current data), which exactly matches “delete seems to work then post reappears”.

## Implementation plan

### 1) Fix the DB trigger function (primary fix)
Create a new migration to replace `public.cleanup_post_video_storage()` so DELETE always returns `OLD`.

Planned behavior:
- `TG_OP = 'DELETE'`:
  - If `OLD.video_url` exists, attempt storage cleanup.
  - Always `RETURN OLD` so row deletion is not canceled.
- `TG_OP = 'UPDATE'`:
  - Cleanup old video if URL changed.
  - `RETURN NEW`.

This is the core fix that will make deletions actually persist.

### 2) Add client-side “actual delete” checks (defensive UX fix)
Even when DB blocks a delete without throwing, Supabase can return no error with zero affected rows. I’ll add guards so UI won’t show false success.

#### In `src/hooks/usePosts.tsx`
- Update `deletePost(postId)` to call delete with `select('id')` (or equivalent affected-row check).
- If no rows were deleted, return an explicit error (`"Post was not deleted"`), do not optimistically remove permanently.

#### In `src/pages/admin/AdminSocial.tsx`
- Update admin delete flow similarly:
  - validate affected rows from delete response,
  - if zero rows, show destructive toast and refresh list,
  - only show success toast when delete is confirmed.

This prevents the “deleted then reappears” confusion even if any future DB issue happens again.

## Files to update

1. `supabase/migrations/<new_timestamp>_fix_posts_delete_trigger.sql`
   - `CREATE OR REPLACE FUNCTION public.cleanup_post_video_storage()` with correct DELETE return behavior.
2. `src/hooks/usePosts.tsx`
   - strengthen delete result validation.
3. `src/pages/admin/AdminSocial.tsx`
   - strengthen delete result validation + clearer failure handling.

## Validation checklist after implementation

1. As a regular user, delete a post with no video from `/social`.
   - Expected: post disappears and does not return after refresh.
2. As admin, delete a non-owned post from `/admin/social`.
   - Expected: success toast only when truly deleted; no reappearance after refresh.
3. Delete a video post.
   - Expected: row is deleted; no trigger regression.
4. Watch network response for DELETE:
   - Expected affected row count/data confirms deletion.
5. Quick regression: create/edit/like/comment flows continue working.

## Technical note

This fix is intentionally focused on correctness of DELETE execution path. The policy migration already applied remains valid and does not need rollback.
