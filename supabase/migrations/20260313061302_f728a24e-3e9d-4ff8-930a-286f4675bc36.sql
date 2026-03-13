
ALTER TABLE public.park_suggestions ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.parks ADD COLUMN IF NOT EXISTS zip_code text;
