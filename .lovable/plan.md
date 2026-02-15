

## Admin Image Upload and Social Proof Controls

### What will change

Both the **Admin Social** edit modal and the **Admin Services** create/edit modal will get a **file upload button** that uploads images directly to the `post-images` Supabase storage bucket. The existing image URL text input will be replaced with a file picker and live preview. All existing features (likes/comments control, edit/delete buttons, admin access checks) are already in place and will be preserved.

### Changes by file

**1. `src/components/social/AdminEditPostModal.tsx`**
- Replace the "Image URL" text input with a file upload area
- Add a hidden `<input type="file" accept="image/*">` and a styled upload button
- On file selection, use `useImageUpload` hook to upload to the `post-images` bucket
- Once uploaded, set the `imageUrl` state to the returned public URL
- Keep the live image preview (already exists)
- Show a loading spinner during upload
- Keep "Pup Name", "Likes Count", and "Comments Count" fields as-is (already working)
- Update the success toast to say "Post Updated Successfully!"

**2. `src/pages/admin/AdminServices.tsx`**
- In the Create/Edit Service modal, replace the "Image URL" text input with a file upload area
- Same pattern: hidden file input, styled button, upload via `useImageUpload` to `post-images` bucket
- On successful upload, set `editForm.image_url` to the public URL
- Keep the live image preview
- Show upload progress spinner

### Technical details

- Both modals will import and use the existing `useImageUpload` hook from `src/hooks/useImageUpload.tsx`
- The hook already handles uploading to any Supabase storage bucket and returns the public URL
- Upload path format: `{userId}/{timestamp}-{random}.{ext}` (handled by the hook)
- Security: Both modals are only accessible within `AdminRoute`-protected pages, which verifies the user is in the `admin_users` table. The `useImageUpload` hook requires an authenticated user.
- No database schema changes are needed -- `image_url` columns already store URL strings
- Query invalidation for `posts` and `services` keys is already wired up in both admin pages
