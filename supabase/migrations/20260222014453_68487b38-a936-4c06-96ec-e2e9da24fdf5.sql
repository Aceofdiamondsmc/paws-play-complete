CREATE POLICY "Authenticated users can read public profiles"
  ON public.profiles
  FOR SELECT
  USING (is_public = true);