

## Fix Inconsistent Storage Bucket Usage

### Problem
`PhotoUploadSheet.tsx` uploads images to the `social_posts` bucket, but every other upload path (and all existing post URLs in the database) use the `post-images` bucket. This causes newly uploaded images from the photo sheet to be stored in a different bucket than where the rest of the app expects them.

### Root Cause
- `useImageUpload.tsx` defaults to `post-images` -- used by `CreatePostForm`, `AdminEditPostModal`, `AdminServices`, `AdminParks`
- `PhotoUploadSheet.tsx` bypasses `useImageUpload` entirely and hardcodes `social_posts` for its direct Supabase upload

### Solution
Update `PhotoUploadSheet.tsx` to use `post-images` instead of `social_posts` in both the `.upload()` and `.getPublicUrl()` calls. This is a two-line change.

No other files need modification -- `useImageUpload` and all other consumers already use `post-images` correctly.

### Files Changed

**`src/components/social/PhotoUploadSheet.tsx`** (2 lines)
- Line 180: Change `.from('social_posts')` to `.from('post-images')` (upload call)
- Line 194: Change `.from('social_posts')` to `.from('post-images')` (getPublicUrl call)

### What About the 7 Files Already in `social_posts`?
Those images will still be accessible since the `social_posts` bucket is public. Any posts referencing those URLs will continue to work. No data migration is needed.

