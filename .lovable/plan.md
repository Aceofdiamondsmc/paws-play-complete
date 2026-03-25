

## Bug: Avatar Not Displaying on First Upload

### Root Cause

**Dog Profile (PackMemberForm - new dog creation)**: This is the primary bug. When adding a **new** dog:
1. User picks a photo → the file is read as a local data URL for preview (line 138-145)
2. User submits the form → `addDog()` creates the dog record **without** the avatar
3. The actual file is **never uploaded** to Supabase Storage — the data URL preview is discarded
4. Result: the dog is created with no avatar. User has to edit the dog and re-upload.

**Dog Profile (editing)**: Works correctly — `uploadDogAvatar` uploads immediately.

**User Profile**: Works correctly — `uploadAvatar` uploads immediately and persists to DB. However, the Supabase Storage URL may hit browser cache if the same image path is reused. This is mitigated by the timestamp in filenames, but could still occur on slow connections where the CDN hasn't propagated yet.

### Fix

**File: `src/components/profile/PackMemberForm.tsx`**

1. Store the pending `File` object in a `useRef` (not just the data URL preview)
2. After `addDog()` succeeds and returns the new dog ID, call `uploadDogAvatar(newDogId, pendingFile)` to upload and persist the avatar
3. Clear the ref after successful upload

Changes:
- Add `const pendingFileRef = useRef<File | null>(null)` 
- In `handleAvatarUpload` (new dog branch, line 138-145): also set `pendingFileRef.current = file`
- In `handleSubmit` after `addDog` succeeds (line 195-197): if `pendingFileRef.current && dog?.id`, call `await uploadDogAvatar(dog.id, pendingFileRef.current)` then clear the ref

**File: `src/components/profile/EditProfileForm.tsx`** (minor improvement)

- Add a cache-busting query param (`?t=timestamp`) to the avatar URL after upload to force the browser to re-fetch, preventing stale cached images from displaying.

### Technical Details

The fix is ~10 lines of code in PackMemberForm. The core change is bridging the gap between "preview selected" and "actually upload" for the new-dog flow. For existing dogs, the upload-on-select pattern already works correctly.

