-- Step 1: Add location columns to profiles for proximity matching
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add index for spatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Step 2: Add RLS policy to allow authenticated users to read all dogs for discovery
CREATE POLICY "dogs_read_for_discovery"
ON public.dogs FOR SELECT
TO authenticated
USING (true);

-- Step 3: Create dogs_discovery view
CREATE VIEW public.dogs_discovery
WITH (security_invoker = on) AS
SELECT 
  d.id,
  d.owner_id,
  d.name,
  d.breed,
  d.size,
  d.energy_level,
  d.bio,
  d.avatar_url,
  d.age_years,
  d.play_style,
  d.created_at,
  p.display_name as owner_display_name,
  p.avatar_url as owner_avatar_url,
  p.city as owner_city,
  p.state as owner_state,
  p.latitude as owner_latitude,
  p.longitude as owner_longitude
FROM dogs d
LEFT JOIN profiles p ON d.owner_id = p.id
WHERE d.owner_id != auth.uid();

-- Step 4: Create RPC function for proximity-sorted dog discovery
CREATE OR REPLACE FUNCTION get_nearby_dogs(
  user_lat double precision,
  user_lng double precision,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  breed text,
  size text,
  energy_level text,
  bio text,
  avatar_url text,
  age_years integer,
  play_style text[],
  created_at timestamptz,
  owner_display_name text,
  owner_avatar_url text,
  owner_city text,
  owner_state text,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.owner_id,
    d.name,
    d.breed,
    d.size,
    d.energy_level,
    d.bio,
    d.avatar_url,
    d.age_years,
    d.play_style,
    d.created_at,
    p.display_name,
    p.avatar_url,
    p.city,
    p.state,
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        ST_DistanceSphere(
          ST_MakePoint(user_lng, user_lat),
          ST_MakePoint(p.longitude, p.latitude)
        )
      ELSE NULL
    END as distance_meters
  FROM dogs d
  LEFT JOIN profiles p ON d.owner_id = p.id
  WHERE d.owner_id != auth.uid()
  ORDER BY 
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        ST_DistanceSphere(
          ST_MakePoint(user_lng, user_lat),
          ST_MakePoint(p.longitude, p.latitude)
        )
      ELSE 999999999
    END ASC
  LIMIT limit_count;
END;
$$;