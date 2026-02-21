-- Add location_public toggle column (defaults to true for existing users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_public boolean NOT NULL DEFAULT true;

-- Recreate public_profiles view: city/state only shown when location_public is true
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  display_name,
  username,
  avatar_url,
  bio,
  CASE WHEN location_public THEN city ELSE NULL END AS city,
  CASE WHEN location_public THEN state ELSE NULL END AS state,
  created_at
FROM profiles
WHERE is_public = true;