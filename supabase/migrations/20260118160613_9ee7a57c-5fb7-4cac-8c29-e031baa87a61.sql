-- Add verification and enrichment columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS verified_latitude double precision,
ADD COLUMN IF NOT EXISTS verified_longitude double precision,
ADD COLUMN IF NOT EXISTS verified_address text,
ADD COLUMN IF NOT EXISTS google_place_id text,
ADD COLUMN IF NOT EXISTS original_description text,
ADD COLUMN IF NOT EXISTS enriched_description text,
ADD COLUMN IF NOT EXISTS suggested_category text,
ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index for faster queries on verified services
CREATE INDEX IF NOT EXISTS idx_services_is_verified ON public.services(is_verified);
CREATE INDEX IF NOT EXISTS idx_services_is_flagged ON public.services(is_flagged);
CREATE INDEX IF NOT EXISTS idx_services_enrichment_status ON public.services(enrichment_status);

-- Update the services_explore view to include verification status
DROP VIEW IF EXISTS public.services_explore;
CREATE VIEW public.services_explore AS
SELECT 
  id,
  name,
  category,
  rating,
  price,
  distance,
  description,
  enriched_description,
  image_url,
  is_featured,
  is_verified,
  is_flagged,
  latitude,
  longitude,
  verified_latitude,
  verified_longitude,
  enrichment_status
FROM public.services
WHERE is_flagged = false OR is_flagged IS NULL;

-- Grant access to the view
GRANT SELECT ON public.services_explore TO anon, authenticated;