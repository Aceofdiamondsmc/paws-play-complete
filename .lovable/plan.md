## Analysis

Yes, this is **completely safe and simple**.

The "Photo Library / File" button uses a hidden `<input type="file">` (line 236). Right now its `accept` attribute is `"image/*,video/*,.heic,.heif"`. On most mobile devices, this causes the OS to offer options like "Take Photo," "Take Video," "Photo Library," and "Browse Files."

To remove the camera/video capture options from this picker, we just need to:

1. **Remove `video/*` from the `accept` attribute** on the gallery input (line 236), changing it to `accept="image/*,.heic,.heif"`. This tells the OS the input only wants images, so it won't offer video recording.
2. **Update the dialog text** (the first-use AlertDialog for gallery) to say "Photos and files" instead of mentioning Camera and video.

This is safe because:

- Video capture is already available on the **Camera** button (which has `capture="environment"` and accepts `video/*`)
- Users can still upload *existing* video files from their library since `image/*` on some platforms still shows the full file picker — but if you want to **fully block video uploads** from the library too, we'd keep only `image/*,.heic,.heif`
- No logic changes needed; the `handleFileSelect` function already handles both image and video files based on MIME type, so narrowing the `accept` just filters what the OS offers

### Changes — `src/components/social/PhotoUploadSheet.tsx`

- **Line 236**: Change `accept="image/*,video/*,.heic,.heif"` → `accept="image/*,.heic,.heif"`
- **Gallery dialog description** (~line 300): Update text to remove camera and video mention if present

Two lines, one file. No risk.