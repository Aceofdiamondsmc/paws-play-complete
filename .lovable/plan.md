
# Fix "record 'old' has no field 'image_path'" Error

## Root Cause

The `posts` table has three storage cleanup triggers that reference a column called `image_path`, but the actual column in the `posts` table is named `image_url`.

```text
Trigger Functions Found:
+--------------------------------------+-------------------+
| Function Name                        | References        |
+--------------------------------------+-------------------+
| posts_delete_storage_trigger         | OLD.image_path    |
| posts_bulk_delete_storage_trigger    | OLD.image_path    |
| posts_update_storage_trigger         | OLD.image_path    |
+--------------------------------------+-------------------+

Actual Posts Table Schema:
- image_url (text) <-- Correct column name
- image_path does NOT exist
```

## Solution

Create a database migration to update all three trigger functions to use `image_url` instead of `image_path`. The `delete_storage_object` function expects a storage path, so we also need to extract the path from the full URL.

## Implementation

### Database Migration

Update the three trigger functions to:
1. Reference `image_url` instead of `image_path`
2. Extract the storage path from the full URL (the URL format is `https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]`)

```sql
-- Fix posts_delete_storage_trigger to use image_url
CREATE OR REPLACE FUNCTION public.posts_delete_storage_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
```

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| New migration file | Create | Fix all three trigger functions |

## Expected Outcome

After the migration:
1. Deleting posts from the Admin Social page will work without errors
2. The storage cleanup will correctly extract paths from URLs and delete orphaned images
3. Update operations that change images will also clean up old files correctly

## Technical Notes

- The `regexp_replace` extracts everything after `/storage/v1/object/public/` from the URL
- The check `storage_path != OLD.image_url` ensures we only call delete if the regex actually matched (external URLs won't be processed)
- The `post_images` child table already uses `image_path` (not a URL), so that part of the bulk delete function remains unchanged
