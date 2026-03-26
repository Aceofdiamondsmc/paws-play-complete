

## Fix: Add INSERT/DELETE Policies to `admin_users` Table

### Problem
The `admin_users` table only has a SELECT policy. There are no INSERT or DELETE policies, so the "Grant Admin" and "Revoke Admin" buttons fail with an RLS violation.

### Solution
One database migration to add two policies:

1. **INSERT policy** — allows existing admins to grant admin to others
2. **DELETE policy** — allows existing admins to revoke admin from others

Both use the existing `is_admin()` security definer function to verify the caller is already an admin.

```sql
CREATE POLICY "Admins can grant admin"
  ON admin_users FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can revoke admin"
  ON admin_users FOR DELETE TO authenticated
  USING (is_admin());
```

### No Code Changes
The frontend `AdminUsers.tsx` already does the correct insert/delete calls. This is a server-side-only fix. No iOS build needed.

