
CREATE OR REPLACE VIEW public.public_posts
WITH (security_invoker = on)
AS
  SELECT
    p.id,
    p.author_id,
    p.content,
    p.image_url,
    p.visibility,
    p.created_at,
    p.updated_at,
    p.dog_id,
    p.pup_name,
    p.likes_count,
    p.comments_count,
    COALESCE(p.author_display_name, pr.display_name) AS author_display_name,
    pr.avatar_url AS author_avatar_url
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.id = p.author_id
  WHERE p.visibility = 'public';
