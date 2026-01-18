-- Add latitude and longitude columns to services table for map markers
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add sample coordinates for existing services (San Francisco area)
UPDATE public.services SET
  latitude = 37.7749 + (random() * 0.05 - 0.025),
  longitude = -122.4194 + (random() * 0.05 - 0.025)
WHERE latitude IS NULL;