

## Add Video Upload Support to Social Tab

### Overview
Enable users to upload and view videos in social posts, alongside the existing image upload flow. Videos will be stored in the same `post-images` Supabase storage bucket and referenced via a new `video_url` column on the `posts` table.

### Changes

#### 1. Database Migration -- Add `video_url` column
- Add `video_url text` column to the `posts` table (nullable, default null)
- Update the `public_posts` view to include the new `video_url` column so the feed can display videos

```text
ALTER TABLE posts ADD COLUMN video_url text;
-- Recreate public_posts view to include video_url
```

#### 2. Update `src/types/index.ts` -- Add `video_url` to Post interface
- Add `video_url: string | null` to the `Post` interface

#### 3. Update `src/components/social/CreatePostForm.tsx` -- Accept video files
- Expand the file input `accept` attribute to include video types (`video/*`)
- Detect whether the selected file is a video or image
- Show a `<video>` preview instead of `<img>` when a video is selected
- Pass `videoUrl` through to the `onPost` callback
- Add a video icon button alongside the existing image/camera buttons

#### 4. Update `src/components/social/PhotoUploadSheet.tsx` -- Accept video files
- Expand file input `accept` to include `video/*`
- Detect video vs image and show appropriate preview (`<video>` with controls)
- Upload videos to the `post-images` bucket (same as images)
- Save the video URL to the `video_url` column when creating the post
- Increase the file size limit for videos (e.g., 50MB)
- Skip HEIC conversion for video files

#### 5. Update `src/hooks/usePosts.tsx` -- Handle `video_url`
- Include `video_url` in the enriched post data from `public_posts` view
- Pass `video_url` through to the `PostWithDetails` interface
- Update `createPost` to accept an optional `videoUrl` parameter and save it

#### 6. Update `src/pages/Social.tsx` -- Render videos in the feed
- When a post has `video_url`, render a `<video>` element with controls (play, pause, muted autoplay optional) instead of the `PostImage` component
- Maintain the same `AspectRatio` wrapper and rounded styling
- Support both image and video on the same post (image takes priority if both exist, or show video)

#### 7. Update `src/hooks/useImageUpload.tsx` -- Support video uploads
- Skip HEIC conversion when the file is a video (check `file.type.startsWith('video/')`)
- No other changes needed -- the upload logic works for any file type

#### 8. Update Admin pages
- `src/pages/admin/AdminSocial.tsx`: Show video thumbnail/icon in the posts table when `video_url` is present

### File Summary

| File | Change |
|------|--------|
| Database migration | Add `video_url` column to `posts`, update `public_posts` view |
| `src/types/index.ts` | Add `video_url` to Post interface |
| `src/hooks/usePosts.tsx` | Include `video_url` in data flow and `createPost` |
| `src/hooks/useImageUpload.tsx` | Skip HEIC conversion for video files |
| `src/components/social/CreatePostForm.tsx` | Accept video files, video preview, pass video URL |
| `src/components/social/PhotoUploadSheet.tsx` | Accept video files, video preview, upload and save video URL |
| `src/pages/Social.tsx` | Render `<video>` element for posts with video_url |
| `src/pages/admin/AdminSocial.tsx` | Show video indicator in admin table |

### Technical Notes
- Videos will be stored in the existing `post-images` Supabase storage bucket (no new bucket needed)
- File size limit for videos: 50MB (vs 10MB for images)
- Video formats supported: MP4, MOV, WebM, and other browser-native formats
- The `<video>` element will use `controls`, `playsInline`, and `preload="metadata"` for good mobile UX
- The existing storage cleanup triggers on the `posts` table only reference `image_url` -- a second trigger will be added for `video_url` cleanup on delete/update
