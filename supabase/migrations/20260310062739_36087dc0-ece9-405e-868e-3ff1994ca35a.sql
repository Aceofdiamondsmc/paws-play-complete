
-- Drop overly permissive INSERT policies that use WITH CHECK (true)
-- Stricter owner-scoped policies already exist on each table

-- post_comments: "Authenticated users can comment" → redundant with comments_insert_self & post_comments_insert
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.post_comments;

-- post_likes: "Authenticated users can like" → redundant with post_likes_insert
DROP POLICY IF EXISTS "Authenticated users can like" ON public.post_likes;

-- playdate_requests: "Temp test insert" → test policy, redundant with playdate_insert_requester
DROP POLICY IF EXISTS "Temp test insert" ON public.playdate_requests;
