DROP FUNCTION IF EXISTS public.get_nearby_dogs(double precision, double precision, integer);

CREATE FUNCTION public.get_nearby_dogs(user_lat double precision, user_lng double precision, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, owner_id uuid, name text, breed text, size text, energy_level text, bio text, avatar_url text, age_years integer, play_style text[], created_at timestamp with time zone, owner_display_name text, owner_avatar_url text, owner_city text, owner_state text, distance_meters double precision, vaccination_certified boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, d.owner_id, d.name, d.breed, d.size, d.energy_level, 
    d.bio, d.avatar_url, d.age_years, d.play_style, d.created_at, 
    p.display_name, p.avatar_url, p.city, p.state,
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL 
      THEN ST_DistanceSphere(ST_MakePoint(user_lng, user_lat), ST_MakePoint(p.longitude, p.latitude))
      ELSE NULL 
    END as distance_meters,
    d.vaccination_certified
  FROM dogs d
  LEFT JOIN profiles p ON d.owner_id = p.id
  WHERE d.is_public = true OR d.owner_id = auth.uid()
  ORDER BY 
    (d.owner_id = auth.uid()) DESC,
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL 
      THEN ST_DistanceSphere(ST_MakePoint(user_lng, user_lat), ST_MakePoint(p.longitude, p.latitude))
      ELSE 999999999 
    END ASC
  LIMIT limit_count;
END;
$function$;