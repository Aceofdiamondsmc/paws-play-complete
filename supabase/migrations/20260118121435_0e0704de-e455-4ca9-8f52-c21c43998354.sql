-- Create storage bucket for social posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('social_posts', 'social_posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own social post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'social_posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to social post images
CREATE POLICY "Social post images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'social_posts');

-- Allow users to update their own files
CREATE POLICY "Users can update their own social post images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'social_posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own social post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'social_posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);