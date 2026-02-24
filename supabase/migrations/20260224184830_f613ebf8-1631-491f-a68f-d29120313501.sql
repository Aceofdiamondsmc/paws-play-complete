
ALTER TABLE posts ADD COLUMN author_avatar_url text;

DROP VIEW IF EXISTS public_posts;
CREATE VIEW public_posts WITH (security_invoker = on) AS
SELECT p.id, p.author_id, p.content, p.image_url, p.video_url,
       p.visibility, p.created_at, p.updated_at, p.dog_id, p.pup_name,
       p.likes_count, p.comments_count,
       COALESCE(p.author_display_name, pr.display_name) AS author_display_name,
       COALESCE(p.author_avatar_url, pr.avatar_url) AS author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.visibility = 'public'::post_visibility;
