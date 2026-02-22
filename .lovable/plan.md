

## Fix: "Unknown User" in Messages and Friends List

### Root Cause

The `public_profiles` view is created with `security_invoker = on`, which means queries through it are subject to the `profiles` table's RLS policies. **Every SELECT policy on `profiles` restricts reads to `id = auth.uid()`** -- so users can only see their own profile row. When the messaging or friends code tries to fetch another user's display name via `public_profiles`, RLS blocks the query and the UI shows "Unknown User".

### The Fix

Add a single new RLS policy to the `profiles` table:

```sql
CREATE POLICY "Authenticated users can read public profiles"
  ON public.profiles
  FOR SELECT
  USING (is_public = true);
```

This allows any authenticated user to SELECT rows where `is_public = true`. The `public_profiles` view already provides a safe layer by:
- Only exposing `id`, `display_name`, `username`, `avatar_url`, `bio`, `city`, `state`, `created_at`
- Hiding `latitude`, `longitude`, `fcm_token`, `onesignal_player_id`, and other sensitive fields
- Conditionally hiding `city`/`state` based on the `location_public` flag

### Security Considerations
- Sensitive columns (GPS coordinates, device tokens) are **never** exposed through the view
- The base table policy only grants access when `is_public = true` -- private profiles remain hidden
- All application code already queries `public_profiles`, not the base `profiles` table directly
- No changes to application code are needed -- this is a database-only fix

### Changes

| What | Detail |
|------|--------|
| **SQL Migration** | Add one new SELECT policy on `profiles` for `is_public = true` |
| **Files changed** | 0 application files -- database policy only |

