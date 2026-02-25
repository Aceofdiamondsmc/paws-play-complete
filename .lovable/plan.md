

## Populate user_roles table with existing admin

### What exists
- The `user_roles` table already exists with columns: `id` (uuid), `user_id` (uuid), `role` (text)
- It is currently empty -- which is why the `vet-service` edge function fails with 403
- There is one admin in `admin_users`: `7ffea141-867a-4b38-b99f-62c7139c86cc`

### Steps

**1. Insert admin role into user_roles**

Use the data insert tool to add the existing admin user with role `'admin'`:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('7ffea141-867a-4b38-b99f-62c7139c86cc', 'admin');
```

This will make the `vet-service` edge function's role check pass for this user.

**2. Add RLS policies to user_roles (migration)**

The `user_roles` table currently has no RLS policies. We need to add policies so the vet-service function (which uses the anon key with user JWT) can read from it:

- Allow authenticated users to read their own roles (needed for the vet-service auth check)
- No insert/update/delete for regular users

```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

**3. Create `has_role` security definer function (migration)**

Following best practices, create a helper function that bypasses RLS for internal role checks:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
```

This ensures edge functions and RLS policies can check roles without recursive issues.

### Files changed
- No application code changes needed -- the `vet-service` function already queries `user_roles` correctly
- One database migration for RLS + helper function
- One data insert for the admin row

