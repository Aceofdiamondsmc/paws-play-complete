
-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public read access for non-flagged services
CREATE POLICY "services_select_public"
ON public.services FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "services_admin_insert"
ON public.services FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "services_admin_update"
ON public.services FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "services_admin_delete"
ON public.services FOR DELETE
USING (public.is_admin());
