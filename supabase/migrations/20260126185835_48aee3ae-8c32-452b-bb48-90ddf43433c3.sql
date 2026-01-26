-- Add RLS policies for dogs table (table already exists with RLS enabled)
CREATE POLICY "dogs_select_own" ON public.dogs
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "dogs_insert_own" ON public.dogs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_update_own" ON public.dogs
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_delete_own" ON public.dogs
  FOR DELETE USING (owner_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dogs_play_style ON public.dogs USING GIN (play_style);
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON public.dogs (owner_id);

-- Storage policies for dog-avatars bucket
CREATE POLICY "dog_avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-avatars');

CREATE POLICY "dog_avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dog-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "dog_avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dog-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "dog_avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dog-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);