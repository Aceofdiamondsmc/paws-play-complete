
-- Function to get user list for admins (bypasses profile RLS safely)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  state text,
  is_public boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  posts_count bigint,
  dogs_count bigint,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.is_public,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    (SELECT count(*) FROM posts WHERE author_id = p.id) AS posts_count,
    (SELECT count(*) FROM dogs WHERE owner_id = p.id) AS dogs_count,
    (EXISTS (SELECT 1 FROM admin_users WHERE user_id = p.id)) AS is_admin
  FROM profiles p
  ORDER BY p.created_at DESC;
$$;

-- Only admins can call it
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;

-- Allow admins to read user_blocks for moderation
CREATE POLICY "admin_read_blocks" ON public.user_blocks
FOR SELECT TO authenticated
USING (is_admin());
