
-- Fix Storage Bucket Exposure
-- Make post-images and social_posts buckets private with RLS-based access control

-- Step 1: Make buckets private
UPDATE storage.buckets SET public = false WHERE id = 'post-images';
UPDATE storage.buckets SET public = false WHERE id = 'social_posts';

-- Step 2: Remove overly permissive public read policies
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Social post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for social posts" ON storage.objects;

-- Step 3: Add RLS policy for post-images - users can view images from public posts or their own posts
CREATE POLICY "View post images based on post access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-images' AND (
    -- User owns the file (their folder)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- File belongs to a public post
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.image_url LIKE '%' || storage.objects.name || '%' 
      AND posts.visibility = 'public'
    )
    OR
    -- User has explicit access to the private post
    EXISTS (
      SELECT 1 FROM public.posts
      JOIN public.post_access ON post_access.post_id = posts.id
      WHERE posts.image_url LIKE '%' || storage.objects.name || '%'
      AND post_access.user_id = auth.uid()
    )
  )
);

-- Step 4: Add RLS policy for social_posts bucket
CREATE POLICY "View social_posts images based on post access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'social_posts' AND (
    -- User owns the file (their folder)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- File belongs to a public post
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.image_url LIKE '%' || storage.objects.name || '%' 
      AND posts.visibility = 'public'
    )
    OR
    -- User has explicit access to the private post
    EXISTS (
      SELECT 1 FROM public.posts
      JOIN public.post_access ON post_access.post_id = posts.id
      WHERE posts.image_url LIKE '%' || storage.objects.name || '%'
      AND post_access.user_id = auth.uid()
    )
  )
);
