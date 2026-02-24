-- Recreate public_posts view to include video_url
DROP VIEW IF EXISTS public_posts;

CREATE VIEW public_posts WITH (security_invoker = on) AS
SELECT p.id,
    p.author_id,
    p.content,
    p.image_url,
    p.video_url,
    p.visibility,
    p.created_at,
    p.updated_at,
    p.dog_id,
    p.pup_name,
    p.likes_count,
    p.comments_count,
    COALESCE(p.author_display_name, pr.display_name) AS author_display_name,
    pr.avatar_url AS author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.visibility = 'public'::post_visibility;

-- Add storage cleanup trigger for video_url
CREATE OR REPLACE FUNCTION public.cleanup_post_video_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  old_path text;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.video_url IS NOT NULL THEN
    old_path := regexp_replace(OLD.video_url, '^.*/object/public/post-images/', '');
    IF old_path IS NOT NULL AND old_path <> '' THEN
      PERFORM delete_storage_object(old_path);
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.video_url IS DISTINCT FROM NEW.video_url AND OLD.video_url IS NOT NULL THEN
    old_path := regexp_replace(OLD.video_url, '^.*/object/public/post-images/', '');
    IF old_path IS NOT NULL AND old_path <> '' THEN
      PERFORM delete_storage_object(old_path);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_video_delete_storage_trigger ON posts;
CREATE TRIGGER posts_video_delete_storage_trigger
BEFORE DELETE OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION cleanup_post_video_storage();