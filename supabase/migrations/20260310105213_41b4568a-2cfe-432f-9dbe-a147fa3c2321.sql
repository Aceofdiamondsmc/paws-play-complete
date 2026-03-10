-- app_settings key-value table for admin controls
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for maintenance banner on client)
CREATE POLICY "app_settings_read_public" ON public.app_settings
FOR SELECT TO public USING (true);

-- Only admins can write
CREATE POLICY "app_settings_write_admin" ON public.app_settings
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are performing scheduled maintenance. Be back shortly!"}'::jsonb),
  ('registration_open', '{"enabled": true}'::jsonb);

-- Platform stats function for admin dashboard
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS TABLE (
  total_users bigint,
  total_posts bigint,
  total_dogs bigint,
  total_parks bigint,
  total_services bigint,
  pending_suggestions bigint,
  users_this_week bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM profiles) AS total_users,
    (SELECT count(*) FROM posts) AS total_posts,
    (SELECT count(*) FROM dogs) AS total_dogs,
    (SELECT count(*) FROM parks) AS total_parks,
    (SELECT count(*) FROM services) AS total_services,
    (SELECT count(*) FROM park_suggestions WHERE status = 'pending') AS pending_suggestions,
    (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days') AS users_this_week;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated;