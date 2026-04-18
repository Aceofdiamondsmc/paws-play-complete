ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.parks ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.park_suggestions ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.service_submissions ADD COLUMN IF NOT EXISTS country text;

-- Backfill existing rows to United States
UPDATE public.profiles SET country = 'United States' WHERE country IS NULL;
UPDATE public.parks SET country = 'United States' WHERE country IS NULL;
UPDATE public.park_suggestions SET country = 'United States' WHERE country IS NULL;
UPDATE public.services SET country = 'United States' WHERE country IS NULL;
UPDATE public.service_submissions SET country = 'United States' WHERE country IS NULL;