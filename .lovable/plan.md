

## Fix "permission denied for function is_admin"

### Problem
The `public.is_admin()` function was created as `SECURITY DEFINER` but no `GRANT EXECUTE` was issued for the `authenticated` role. When the admin tries to insert a service, the RLS policy calls `is_admin()`, which fails with a permission error before it even runs.

### Root Cause
By default, only the function owner (postgres/superuser) can execute functions unless explicitly granted. The original migration that created `is_admin()` omitted the GRANT statement.

### Fix
A single database migration that grants execute permission on `is_admin()` to the `authenticated` role:

```sql
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

This also fixes the same potential issue for the parks table (which uses the same function in its RLS policies).

### No Code Changes Needed
The `AdminServices.tsx` page and all hooks already work correctly -- the only issue is the missing database permission.

