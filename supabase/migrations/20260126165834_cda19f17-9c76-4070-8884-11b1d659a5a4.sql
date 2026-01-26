-- Drop conflicting/restrictive SELECT policies
DROP POLICY IF EXISTS "Users can only see their own full post data" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.posts;
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "posts_read" ON public.posts;
DROP POLICY IF EXISTS "public_read_posts_public_visibility" ON public.posts;

-- Create a single, clear SELECT policy for all users
CREATE POLICY "posts_select_public_or_own"
ON public.posts
FOR SELECT
TO authenticated, anon
USING (
  visibility = 'public'::post_visibility
  OR author_id = auth.uid()
);