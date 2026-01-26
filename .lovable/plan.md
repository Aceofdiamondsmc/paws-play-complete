
# Fix: Social Feed Empty for Logged-In Users

## Root Cause Analysis

The `posts` table has **conflicting Row-Level Security (RLS) policies** for SELECT operations. When you're logged out (using `anon` role), a permissive policy allows reading all public posts. But when you're logged in (using `authenticated` role), there's a restrictive policy that only allows you to see **your own posts**.

The problematic policy:
```
Policy: "Users can only see their own full post data"
Command: SELECT
Role: authenticated
USING: (auth.uid() = author_id)  <-- Only sees own posts!
```

This conflicts with the intended behavior where both logged-in and logged-out users should see the same public feed.

## Solution

Clean up the RLS policies on the `posts` table by removing or modifying the restrictive policies so that:
1. All users (authenticated or anonymous) can read public posts
2. Authenticated users can additionally see their own private posts
3. Remove duplicate/conflicting policies

## Implementation Steps

### Step 1: Database Migration

Run a SQL migration to fix the RLS policies:

```sql
-- Drop conflicting/restrictive SELECT policies
DROP POLICY IF EXISTS "Users can only see their own full post data" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.posts;
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "posts_read" ON public.posts;

-- Create a single, clear SELECT policy for all users
CREATE POLICY "posts_select_public_or_own"
ON public.posts
FOR SELECT
TO authenticated, anon
USING (
  visibility = 'public'::post_visibility
  OR author_id = auth.uid()
);
```

This consolidates all SELECT policies into one clear rule:
- **Anyone** can see public posts
- **Authors** can see their own posts (including private ones)

### Step 2: No Code Changes Required

The `usePosts` hook is already correctly fetching posts without visibility filters. Once the RLS policies are fixed, posts will appear for logged-in users.

---

## Technical Details

### Current Policy Conflict
| Policy Name | Role | Condition | Problem |
|-------------|------|-----------|---------|
| Users can only see their own full post data | authenticated | author_id = auth.uid() | Blocks public posts from other users |
| public_read_posts_public_visibility | anon, authenticated | visibility = 'public' | Should work but gets overshadowed |

### After Fix
| Policy Name | Role | Condition | Behavior |
|-------------|------|-----------|----------|
| posts_select_public_or_own | anon, authenticated | visibility = 'public' OR author_id = auth.uid() | Everyone sees public + authors see own private |

---

## Expected Outcome

After the migration:
- Logged-out users will see all public posts (no change)
- Logged-in users will see all public posts **plus** their own private posts
- The Social feed will show the same content regardless of login state (for public posts)
