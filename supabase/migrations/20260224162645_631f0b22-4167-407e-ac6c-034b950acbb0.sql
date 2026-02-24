UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/quicktime','video/webm'
],
file_size_limit = 52428800
WHERE id = 'post-images';