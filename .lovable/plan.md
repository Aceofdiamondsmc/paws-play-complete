

## Refinements to PhotoUploadSheet

### Changes in `src/components/social/PhotoUploadSheet.tsx`

**1. Camera button: add video support**
- Change the camera file input `accept` from `"image/*,.heic,.heif"` to `"image/*,video/*,.heic,.heif"` (line 230)
- Update the camera permission dialog description (line 286) to mention video: *"Paws Play needs access to your camera to take photos and videos."*
- Update the button label from "Camera" to "Camera" (stays the same -- already clear)

**2. Rename Photo/Video button to "Photo Library / File"**
- Change label text on line 239 from `"Photo / Video"` to `"Photo Library / File"`
- Update the gallery permission dialog title (line 299) from `"🖼️ Photo Library"` to `"🖼️ Photo Library / File"`
- Update the gallery dialog description (line 300-301) to: *"Photos and files you select will be uploaded and shared with the pack."*
- Change the gallery file input `accept` to `"image/*,.heic,.heif"` (remove `video/*` since video capture is now on Camera) -- actually, keep `video/*` too since users may want to upload a saved video file from their library. Best logic: keep `accept="image/*,video/*,.heic,.heif"` on gallery as well.

**3. Icon update**
- Import `FolderOpen` from lucide-react to pair with the library/file concept, replacing the current `ImageIcon` usage on the gallery button.

Four small edits, all in one file.

