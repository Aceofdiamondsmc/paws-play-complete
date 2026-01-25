-- Create a security definer function to check admin role if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  )
$$;

-- Allow all authenticated users to read parks
CREATE POLICY "parks_select_authenticated"
ON public.parks
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert parks
CREATE POLICY "parks_insert_admin"
ON public.parks
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Allow admins to update parks
CREATE POLICY "parks_update_admin"
ON public.parks
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admins to delete parks
CREATE POLICY "parks_delete_admin"
ON public.parks
FOR DELETE
TO authenticated
USING (public.is_admin());