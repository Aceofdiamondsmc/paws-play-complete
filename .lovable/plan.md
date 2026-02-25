

## Fix: Posts Cannot Be Deleted (RLS Policy Issue)

### Problem

All Row-Level Security (RLS) DELETE policies on the `posts` table are set to **RESTRICTIVE**. In PostgreSQL, restrictive policies act as additional AND filters — the user must satisfy **every single one** simultaneously. 

Currently there are 6 DELETE policies, all restrictive:
- "Admins can delete any post" (checks admin_users table)
- "Admins can delete posts" (checks email)
- "Authenticated delete posts" (allows all — but still AND'd)
- "Users can delete their own posts" (checks author_id)
- "posts_delete" (checks author_id)
- "Allow authors to manage own posts" (ALL command, checks author_id)

Since these are all RESTRICTIVE, a non-admin user fails the admin checks, and an admin who isn't the author fails the author checks. **Nobody can delete anything.**

### Solution

Run a single database migration that:

1. **Drops all existing DELETE policies** on the `posts` table
2. **Creates two clean PERMISSIVE policies** (PERMISSIVE means any ONE matching policy is sufficient):
   - **Authors can delete own posts** — `author_id = auth.uid()` (PERMISSIVE)
   - **Admins can delete any post** — checks `admin_users` table (PERMISSIVE)

### Technical Details

Migration SQL:

```sql
-- Drop all existing DELETE policies on posts
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;
DROP POLICY IF EXISTS "Authenticated delete posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;

-- Create two clean PERMISSIVE delete policies
CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "posts_delete_admin"
  ON posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
  ));
```

Note: The existing `"Allow authors to manage own posts"` ALL-command policy and `"Authenticated delete posts"` (which allows everyone) are also problematic. The ALL-command policy covers DELETE too but is restrictive, compounding the issue. We leave the ALL policy in place (it covers other operations) but the new permissive DELETE policies will allow deletes to succeed.

### No Code Changes Needed

The frontend delete logic in `usePosts.tsx`, `Social.tsx`, and `AdminSocial.tsx` is already correct — the issue is purely at the database RLS layer.

### Files Changed

| Target | Change |
|--------|--------|
| Database migration | Drop conflicting restrictive DELETE policies, create 2 permissive ones |

