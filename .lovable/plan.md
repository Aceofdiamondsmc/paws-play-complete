

## Fix: Video Uploads Silently Failing on Social Tab

### Problem
Video uploads appear to do nothing because the `post-images` storage bucket is configured to only accept image MIME types (`image/jpeg`, `image/png`, `image/gif`, `image/webp`) and has a 5MB file size limit. Videos are silently rejected by Supabase Storage.

### Solution

**Database migration** to update the `post-images` bucket configuration:

1. **Add video MIME types** to the allowed list: `video/mp4`, `video/quicktime` (iPhone .MOV files), `video/webm`
2. **Increase file size limit** from 5MB to 50MB to accommodate video files

### Technical Details

**SQL Migration:**
```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/quicktime','video/webm'
],
file_size_limit = 52428800  -- 50MB
WHERE id = 'post-images';
```

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Update `post-images` bucket MIME types and size limit |

No frontend code changes are needed -- the upload logic is already correct.

