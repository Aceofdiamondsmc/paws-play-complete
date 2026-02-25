-- Drop all existing RESTRICTIVE DELETE policies on posts
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;
DROP POLICY IF EXISTS "Authenticated delete posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;

-- Create two clean PERMISSIVE delete policies
CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "posts_delete_admin"
  ON posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
  ));