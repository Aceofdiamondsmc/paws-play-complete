-- 1. Drop overly permissive service-images storage policies
DROP POLICY IF EXISTS "service_images_service_role_insert" ON storage.objects;
DROP POLICY IF EXISTS "service_images_service_role_update" ON storage.objects;
DROP POLICY IF EXISTS "service_images_service_role_delete" ON storage.objects;

-- 2. Fix care_reminder_sent_log RLS - replace open policy with owner-scoped read
DROP POLICY IF EXISTS "Service role full access" ON public.care_reminder_sent_log;

CREATE POLICY "care_log_owner_read"
  ON public.care_reminder_sent_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_reminders cr
      WHERE cr.id = care_reminder_sent_log.reminder_id
        AND cr.user_id = auth.uid()
    )
  );

-- 3. Fix get_nearby_services - add SET search_path = public
CREATE OR REPLACE FUNCTION public.get_nearby_services(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 40000,
  filter_category text DEFAULT NULL::text
)
RETURNS TABLE(
  id bigint, name text, category text, rating numeric, price text,
  description text, enriched_description text, image_url text,
  is_featured boolean, is_verified boolean, is_flagged boolean,
  latitude double precision, longitude double precision,
  verified_latitude double precision, verified_longitude double precision,
  phone text, website text, photo_reference text, enrichment_status text,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_point geography;
BEGIN
  user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    s.id, s.name, s.category, s.rating, s.price,
    s.description, s.enriched_description, s.image_url,
    s.is_featured, s.is_verified, s.is_flagged,
    s.latitude, s.longitude, s.verified_latitude, s.verified_longitude,
    s.phone, s.website, s.photo_reference, s.enrichment_status,
    CASE 
      WHEN s.geo IS NOT NULL THEN ST_Distance(s.geo, user_point)
      WHEN COALESCE(s.verified_latitude, s.latitude) IS NOT NULL 
           AND COALESCE(s.verified_longitude, s.longitude) IS NOT NULL THEN 
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            COALESCE(s.verified_longitude, s.longitude), 
            COALESCE(s.verified_latitude, s.latitude)
          ), 4326)::geography,
          user_point
        )
      ELSE NULL
    END AS distance_meters
  FROM services s
  WHERE 
    (filter_category IS NULL OR s.category = filter_category)
    AND (
      (s.geo IS NOT NULL AND ST_DWithin(s.geo, user_point, radius_meters))
      OR 
      (s.geo IS NULL 
       AND COALESCE(s.verified_latitude, s.latitude) IS NOT NULL 
       AND COALESCE(s.verified_longitude, s.longitude) IS NOT NULL 
       AND ST_DWithin(
         ST_SetSRID(ST_MakePoint(
           COALESCE(s.verified_longitude, s.longitude), 
           COALESCE(s.verified_latitude, s.latitude)
         ), 4326)::geography,
         user_point,
         radius_meters
       ))
    )
  ORDER BY 
    s.is_featured DESC,
    distance_meters ASC NULLS LAST;
END;
$function$;