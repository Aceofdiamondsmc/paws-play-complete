-- Create a function to get nearby parks using PostGIS
-- This uses the geom column for accurate spatial queries

CREATE OR REPLACE FUNCTION get_nearby_parks(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 10000
)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  description text,
  latitude double precision,
  longitude double precision,
  geom geometry,
  image_url text,
  rating numeric,
  user_ratings_total integer,
  is_fully_fenced boolean,
  has_water_station boolean,
  has_small_dog_area boolean,
  has_large_dog_area boolean,
  has_agility_equipment boolean,
  has_parking boolean,
  has_grass_surface boolean,
  is_dog_friendly boolean,
  gemini_summary text,
  place_id text,
  added_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.description,
    p.latitude,
    p.longitude,
    p.geom,
    p.image_url,
    p.rating,
    p.user_ratings_total,
    p.is_fully_fenced,
    p.has_water_station,
    p.has_small_dog_area,
    p.has_large_dog_area,
    p.has_agility_equipment,
    p.has_parking,
    p.has_grass_surface,
    p.is_dog_friendly,
    p.gemini_summary,
    p.place_id,
    p.added_by,
    p.created_at,
    p.updated_at,
    ST_Distance(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM parks p
  WHERE 
    p.is_dog_friendly = true
    AND p.geom IS NOT NULL
    AND ST_DWithin(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$;