

## Plan: Build Admin Users Management Page

### Overview
Build a full-featured Admin Users page that lets you search, inspect, and moderate user accounts. This covers the key admin needs for a social pet app: viewing user activity, managing roles, and handling abuse/blocks.

### Database Changes

**1. Migration: Create an admin-accessible view for user data**

Create a `SECURITY DEFINER` function `admin_get_users()` that joins `profiles` with activity counts (posts, dogs, blocks) so the admin can see everything in one place without needing direct RLS-bypassing SELECT on `profiles`.

```sql
-- Function to get user list for admins (bypasses profile RLS safely)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  state text,
  is_public boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  posts_count bigint,
  dogs_count bigint,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.is_public,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    (SELECT count(*) FROM posts WHERE author_id = p.id) AS posts_count,
    (SELECT count(*) FROM dogs WHERE owner_id = p.id) AS dogs_count,
    (EXISTS (SELECT 1 FROM admin_users WHERE user_id = p.id)) AS is_admin
  FROM profiles p
  ORDER BY p.created_at DESC;
$$;

-- Only admins can call it
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;
```

**2. Migration: RLS policy for admin to read `user_blocks`**

```sql
CREATE POLICY "admin_read_blocks" ON public.user_blocks
FOR SELECT TO authenticated
USING (is_admin());
```

### Frontend Changes

**`src/pages/admin/AdminUsers.tsx`** — Full rewrite with these sections:

**Header area:**
- Total user count + new users this week stat cards
- Search bar (filters by display name, username, city)

**User table:**
- Columns: Avatar, Name/Username, Location, Dogs, Posts, Status (public/private), Joined, Actions
- Sortable by join date (default newest first)
- Paginated client-side (20 per page)

**User detail drawer (Sheet):**
- Opens when clicking a row
- Shows full profile info, bio, dogs list, post count
- Action buttons:
  - **Toggle Admin** — insert/delete from `admin_users` table
  - **View Blocks** — shows who this user has blocked and who blocked them (via `user_blocks`)
  - **View Posts** — link to Admin Social filtered by this user

**Key patterns followed:**
- Same table/card layout as AdminSocial and AdminParks
- Uses `supabase.rpc('admin_get_users')` for data fetching
- Uses `admin_users` table for role management (consistent with existing pattern)
- Search + loading skeleton pattern from AdminSocial

### Files

| File | Action |
|------|--------|
| `src/pages/admin/AdminUsers.tsx` | Rewrite |
| Database migration | New function + RLS policy |

### What this covers for a pet social app

- **Spam/fake accounts**: Quickly spot accounts with 0 dogs, 0 posts, no avatar
- **Abuse management**: See block relationships to identify problematic users
- **Role management**: Promote/demote admins without touching the database directly
- **User support**: Look up any user by name/username to investigate issues
- **Growth tracking**: See total users and new signups at a glance

