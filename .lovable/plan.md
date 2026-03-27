

## Fix "Refresh Stats" — Permission Denied on `admin_get_platform_stats`

### Problem
The `admin_get_platform_stats()` function exists in the database, but the `GRANT EXECUTE` statement from the original migration didn't persist. Calling the function returns `permission denied`.

### Solution
Create a new migration that re-grants execute permission on the function to `authenticated` and `anon` roles (Supabase requires both for RPC calls through the client).

### Changes

| What | How |
|---|---|
| New SQL migration | `GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated, anon;` |

Single migration, no code changes needed. The existing `AdminSettings.tsx` code already calls this function correctly.

### Security Note
The function is `SECURITY DEFINER` and queries internal tables. Currently it has no admin check inside the function body — any authenticated user could call it. We should also add an admin guard inside the function. The updated function will check `is_admin()` and return empty if the caller isn't an admin.

