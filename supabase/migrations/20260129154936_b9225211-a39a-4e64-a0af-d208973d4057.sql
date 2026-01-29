-- Add storage policies for user-profiles bucket to allow authenticated uploads

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow anyone to read avatars (public bucket)
CREATE POLICY "Anyone can view user avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'user-profiles');