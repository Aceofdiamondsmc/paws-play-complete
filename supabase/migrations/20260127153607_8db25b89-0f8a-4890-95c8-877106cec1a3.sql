-- Drop the existing broken get_nearby_parks function first
DROP FUNCTION IF EXISTS public.get_nearby_parks(double precision, double precision, double precision);

-- Create the get_parks_nearby function with pagination support
CREATE OR REPLACE FUNCTION public.get_parks_nearby(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 10000,
  page_size integer DEFAULT 50,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  name text,
  address text,
  city text,
  state text,
  description text,
  latitude double precision,
  longitude double precision,
  geom text,
  image_url text,
  rating double precision,
  user_ratings_total bigint,
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
  added_by text,
  created_at text,
  updated_at text,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_point geography;
BEGIN
  user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    p."Id" AS id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.description,
    p.latitude,
    p.longitude,
    p.geom,
    p.image_url,
    p.rating,
    p.user_rating_total AS user_ratings_total,
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
    CASE 
      WHEN p.geo IS NOT NULL THEN ST_Distance(p.geo, user_point)
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN 
        ST_Distance(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
          user_point
        )
      ELSE NULL
    END AS distance_meters
  FROM parks p
  WHERE 
    (
      (p.geo IS NOT NULL AND ST_DWithin(p.geo, user_point, radius_meters))
      OR 
      (p.geo IS NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND 
       ST_DWithin(
         ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
         user_point,
         radius_meters
       ))
    )
  ORDER BY distance_meters ASC NULLS LAST
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- Recreate get_nearby_parks as a wrapper for backwards compatibility
CREATE OR REPLACE FUNCTION public.get_nearby_parks(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 10000
)
RETURNS TABLE (
  id bigint,
  name text,
  address text,
  city text,
  state text,
  description text,
  latitude double precision,
  longitude double precision,
  geom text,
  image_url text,
  rating double precision,
  user_ratings_total bigint,
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
  added_by text,
  created_at text,
  updated_at text,
  distance_meters double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.get_parks_nearby(user_lat, user_lng, radius_meters, 1000, 0);
$$;