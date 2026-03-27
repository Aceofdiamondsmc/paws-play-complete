
-- Replace function with admin guard
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS TABLE(
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
    CASE WHEN is_admin() THEN (SELECT count(*) FROM profiles) ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM posts) ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM dogs) ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM parks) ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM services) ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM park_suggestions WHERE status = 'pending') ELSE 0 END,
    CASE WHEN is_admin() THEN (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days') ELSE 0 END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated, anon;
