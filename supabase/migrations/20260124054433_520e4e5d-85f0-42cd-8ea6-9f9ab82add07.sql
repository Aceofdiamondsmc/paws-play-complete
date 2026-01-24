-- Fix users table - Enable RLS and add owner-only policies
-- The users table currently has no RLS policies, exposing email addresses

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can only update their own data
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can only insert their own data
CREATE POLICY "users_insert_own"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can only delete their own data
CREATE POLICY "users_delete_own"
ON public.users FOR DELETE
TO authenticated
USING (id = auth.uid());