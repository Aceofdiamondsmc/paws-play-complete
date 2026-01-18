-- Create storage bucket for social post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('social_posts', 'social_posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social_posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all social post images
CREATE POLICY "Public read access for social posts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'social_posts');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'social_posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);