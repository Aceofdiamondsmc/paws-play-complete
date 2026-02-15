-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated can view own admin_user" ON public.admin_users;

CREATE POLICY "Authenticated can view own admin_user"
ON public.admin_users
FOR SELECT
TO authenticated
USING (( SELECT auth.uid() AS uid) = user_id);