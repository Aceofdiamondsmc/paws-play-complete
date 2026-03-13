
-- Add vet_verified column to dogs
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS vet_verified boolean DEFAULT false;

-- Recreate get_nearby_dogs with vet_verified
DROP FUNCTION IF EXISTS public.get_nearby_dogs(double precision, double precision, integer);

CREATE FUNCTION public.get_nearby_dogs(user_lat double precision, user_lng double precision, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, owner_id uuid, name text, breed text, size text, energy_level text, bio text, avatar_url text, age_years integer, play_style text[], created_at timestamp with time zone, owner_display_name text, owner_avatar_url text, owner_city text, owner_state text, distance_meters double precision, vaccination_certified boolean, vet_verified boolean)
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
    d.vaccination_certified,
    d.vet_verified
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

-- Allow admins to update any dog's vet_verified status
CREATE POLICY "admins_update_vet_verified" ON public.dogs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Allow admins to read all vaccination_records
CREATE POLICY "admins_read_all_vaccination_records" ON public.vaccination_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Allow admins to update all vaccination_records
CREATE POLICY "admins_update_all_vaccination_records" ON public.vaccination_records
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
