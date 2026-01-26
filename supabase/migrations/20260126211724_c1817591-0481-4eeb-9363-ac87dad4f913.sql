-- Fix posts_delete_storage_trigger to use image_url
CREATE OR REPLACE FUNCTION public.posts_delete_storage_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  storage_path TEXT;
BEGIN
  IF OLD.image_url IS NOT NULL THEN
    -- Extract path after '/storage/v1/object/public/'
    storage_path := regexp_replace(OLD.image_url, '^.*/storage/v1/object/public/', '');
    IF storage_path IS NOT NULL AND storage_path != OLD.image_url THEN
      PERFORM public.delete_storage_object(storage_path);
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- Fix posts_bulk_delete_storage_trigger
CREATE OR REPLACE FUNCTION public.posts_bulk_delete_storage_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  img_record RECORD;
  storage_path TEXT;
BEGIN
  -- Delete main image if exists
  IF OLD.image_url IS NOT NULL THEN
    storage_path := regexp_replace(OLD.image_url, '^.*/storage/v1/object/public/', '');
    IF storage_path IS NOT NULL AND storage_path != OLD.image_url THEN
      PERFORM public.delete_storage_object(storage_path);
    END IF;
  END IF;

  -- Delete all images in child table
  FOR img_record IN SELECT image_path FROM public.post_images WHERE post_id = OLD.id LOOP
    PERFORM public.delete_storage_object(img_record.image_path);
  END LOOP;
  RETURN OLD;
END;
$$;

-- Fix posts_update_storage_trigger
CREATE OR REPLACE FUNCTION public.posts_update_storage_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_path TEXT;
BEGIN
  IF (OLD.image_url IS DISTINCT FROM NEW.image_url) AND (OLD.image_url IS NOT NULL) THEN
    old_path := regexp_replace(OLD.image_url, '^.*/storage/v1/object/public/', '');
    IF old_path IS NOT NULL AND old_path != OLD.image_url THEN
      PERFORM public.delete_storage_object(old_path);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;