-- Add missing columns to dogs table for age, weight, and health info
ALTER TABLE public.dogs 
ADD COLUMN IF NOT EXISTS age_years integer,
ADD COLUMN IF NOT EXISTS weight_lbs numeric,
ADD COLUMN IF NOT EXISTS health_info text;

-- Insert default play styles
INSERT INTO public.play_styles (id, name, description, icon, color) VALUES
  (gen_random_uuid(), 'Fetch Fanatic', 'Loves to chase and retrieve balls and toys', 'zap', '#22c55e'),
  (gen_random_uuid(), 'Water Lover', 'Enjoys swimming and playing in water', 'droplets', '#3b82f6'),
  (gen_random_uuid(), 'Tug Champion', 'Expert at tug-of-war games', 'trophy', '#f59e0b'),
  (gen_random_uuid(), 'Chase Expert', 'Loves to run and chase other dogs', 'wind', '#8b5cf6'),
  (gen_random_uuid(), 'Cuddler', 'Prefers gentle play and affection', 'heart', '#ec4899'),
  (gen_random_uuid(), 'Active', 'High energy, always ready to play', 'flame', '#ef4444'),
  (gen_random_uuid(), 'Shy', 'Takes time to warm up to new friends', 'sparkles', '#6b7280'),
  (gen_random_uuid(), 'Social Butterfly', 'Loves meeting new dogs and people', 'users', '#06b6d4')
ON CONFLICT DO NOTHING;

-- Enable RLS on play_styles
ALTER TABLE public.play_styles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to play_styles (drop if exists first)
DROP POLICY IF EXISTS "play_styles_public_read" ON public.play_styles;
CREATE POLICY "play_styles_public_read"
ON public.play_styles FOR SELECT
USING (true);

-- Enable RLS on dog_play_styles
ALTER TABLE public.dog_play_styles ENABLE ROW LEVEL SECURITY;

-- Dog owners can manage their dogs' play styles
DROP POLICY IF EXISTS "dog_play_styles_owner_manage" ON public.dog_play_styles;
CREATE POLICY "dog_play_styles_owner_manage"
ON public.dog_play_styles FOR ALL
USING (EXISTS (
  SELECT 1 FROM dogs d WHERE d.id = dog_play_styles.dog_id AND d.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM dogs d WHERE d.id = dog_play_styles.dog_id AND d.owner_id = auth.uid()
));

-- Enable RLS on vaccination_records
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

-- Dog owners can manage their dogs' vaccination records
DROP POLICY IF EXISTS "vaccination_records_owner_manage" ON public.vaccination_records;
CREATE POLICY "vaccination_records_owner_manage"
ON public.vaccination_records FOR ALL
USING (EXISTS (
  SELECT 1 FROM dogs d WHERE d.id = vaccination_records.dog_id AND d.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM dogs d WHERE d.id = vaccination_records.dog_id AND d.owner_id = auth.uid()
));

-- Create storage bucket for vaccination documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vaccination-docs', 'vaccination-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vaccination documents
DROP POLICY IF EXISTS "vaccination_docs_owner_upload" ON storage.objects;
CREATE POLICY "vaccination_docs_owner_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vaccination-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "vaccination_docs_owner_read" ON storage.objects;
CREATE POLICY "vaccination_docs_owner_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vaccination-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "vaccination_docs_owner_delete" ON storage.objects;
CREATE POLICY "vaccination_docs_owner_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'vaccination-docs' AND auth.uid()::text = (storage.foldername(name))[1]);