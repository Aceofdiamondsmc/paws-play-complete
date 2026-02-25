CREATE OR REPLACE FUNCTION public.cleanup_post_video_storage()
RETURNS TRIGGER AS $$
DECLARE
  video_path TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Attempt to clean up video from storage if present
    IF OLD.video_url IS NOT NULL THEN
      video_path := regexp_replace(OLD.video_url, '^.*/storage/v1/object/public/[^/]+/', '');
      IF video_path IS NOT NULL AND video_path != '' THEN
        PERFORM public.delete_storage_object(video_path);
      END IF;
    END IF;
    -- Always return OLD so the delete proceeds
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Clean up old video if URL changed
    IF OLD.video_url IS NOT NULL AND (NEW.video_url IS NULL OR NEW.video_url != OLD.video_url) THEN
      video_path := regexp_replace(OLD.video_url, '^.*/storage/v1/object/public/[^/]+/', '');
      IF video_path IS NOT NULL AND video_path != '' THEN
        PERFORM public.delete_storage_object(video_path);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;