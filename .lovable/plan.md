

## Fix: Video Posts Not Fully Supported in Admin Social

### Problem
Video posts created on the Social tab are stored correctly in the database (with `video_url`), and appear in the Admin Social table with a video icon. However, the **AdminEditPostModal** has no awareness of video URLs -- it only handles `image_url`. This means:
- Admins can't see or preview the video when editing a post
- Admins can't upload or change video URLs
- The video URL is preserved on save (since it's not in the update payload), but it's invisible to the admin

### Solution
Add video URL support to the AdminEditPostModal, including:
1. Display a video preview when the post has a `video_url`
2. Allow uploading or pasting a video URL
3. Include `video_url` in the save/update payload
4. Pass `video_url` from AdminSocial to the edit modal

### Files Changed

| File | Change |
|------|--------|
| `src/components/social/AdminEditPostModal.tsx` | Add `initialVideoUrl` prop, video state, video upload/URL input, video preview, include `video_url` in save |
| `src/pages/admin/AdminSocial.tsx` | Pass `initialVideoUrl={editingPost?.video_url ?? ''}` to AdminEditPostModal |

### Technical Details

**AdminEditPostModal.tsx**
- Add new prop `initialVideoUrl: string` to the interface
- Add `videoUrl` state, initialized from `initialVideoUrl`
- Add a "Video" section below the existing Image section with:
  - Upload button (accepts `video/*`) 
  - URL text input for manual entry
  - Video preview element when a URL is present
  - Clear (X) button to remove the video
- Update `handleSave` to include `video_url: videoUrl.trim() || null` in the update payload
- When a video is uploaded, set `videoUrl` to the public URL from Supabase storage

**AdminSocial.tsx**
- Add `initialVideoUrl={editingPost?.video_url ?? ''}` prop to the `<AdminEditPostModal>` component

