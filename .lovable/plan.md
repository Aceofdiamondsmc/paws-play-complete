

## Fix: Admin Park Deletion Silently Failing

### Root Cause

The `is_admin()` function (no arguments) checks `(auth.jwt() ->> 'user_role') = 'admin'`, which is a JWT custom claim that is **never set** in this project. The RLS policies for parks (`parks_delete_admin`, `parks_update_admin`, `parks_insert_admin`) all use this broken `is_admin()`.

Meanwhile, the app's `useAdmin` hook correctly checks the `admin_users` table. The overloaded `is_admin(uid uuid)` also correctly checks `admin_users`. So the no-arg version is the only broken one.

Supabase's `.delete()` returns success even when RLS blocks the operation (0 rows affected), which is why the toast says "Success" but nothing is actually deleted.

### Fix

**Single SQL migration** to replace the no-arg `is_admin()` function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;
```

This makes the no-arg version check `admin_users` (same as the uid-arg version), fixing all RLS policies that depend on it: `parks_delete_admin`, `parks_update_admin`, `parks_insert_admin`, `park_suggestions_*_admin`, and `app_settings_write_admin`.

No frontend code changes needed.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Replace `is_admin()` to check `admin_users` table instead of JWT claim |

