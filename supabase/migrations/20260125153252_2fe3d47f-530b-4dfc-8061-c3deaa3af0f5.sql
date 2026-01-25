-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "parks_select_authenticated" ON public.parks;

-- Create a new policy that allows everyone (including anonymous users) to read parks
CREATE POLICY "parks_select_public" ON public.parks
  FOR SELECT
  USING (true);