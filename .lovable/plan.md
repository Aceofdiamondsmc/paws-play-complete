

## Add Admin Avatar Field to CreatePostForm

### Overview
Add an avatar upload/URL input field to the CreatePostForm, visible only to admins, so they can set a custom avatar (e.g., a brand logo) when posting as an official account -- without needing to edit the post afterward.

### Changes

#### 1. `src/components/social/CreatePostForm.tsx`
- Add `adminAvatarUrl` state and an `adminAvatarFile` state
- Add a hidden file input for avatar upload
- In the admin section (next to the display name field), add:
  - A small avatar preview (using the Avatar component)
  - A click-to-upload button for the avatar image
  - A text input for manual URL entry (matching the existing "Dual Image Input" pattern)
- Upload the avatar file via `useImageUpload` during `handleSubmit`, before calling `onPost`
- Pass `adminAvatarUrl` through the `onPost` callback
- Reset avatar state on form submission

#### 2. `src/components/social/CreatePostForm.tsx` - Props update
- Extend `onPost` signature to include `authorAvatarUrl?: string` parameter

#### 3. `src/pages/Social.tsx`
- Update `handlePost` to accept and forward `authorAvatarUrl` to `createPost`

#### 4. `src/hooks/usePosts.tsx`
- Update `createPost` to accept `authorAvatarUrl` parameter
- Include `author_avatar_url` in the insert payload (the column already exists on the `posts` table)

### Technical Details

The `posts` table already has an `author_avatar_url` column, so no database migration is needed. The flow mirrors how `author_display_name` is currently handled -- passed from form to hook to insert.

The avatar input will use the same "Dual Image Input" pattern used in admin edit modals: upload populates the URL field, and both sync with a live preview.

