

## Fix: Consolidate to Two Buttons with Proper Camera Permission Handling

### Problem
Currently there are three buttons (Camera, Gallery, Video) but Gallery and Video open the exact same file picker. The Camera button with `capture="environment"` doesn't reliably work on all web browsers. For App Store compliance, we need proper permission handling with user-facing feedback.

### Solution
Consolidate into **two buttons** with proper permission logic:

1. **Camera** -- requests camera permission via `getUserMedia`, shows a clear toast if denied, then opens the file input with `capture="environment"`. On permission failure, falls back to opening the gallery picker instead (so the user isn't blocked).

2. **Photo / Video** -- opens the gallery file picker directly (no permission needed), accepts images + video.

### Changes to `src/components/social/PhotoUploadSheet.tsx`

- Add `handleCameraClick` that checks `navigator.mediaDevices.getUserMedia({ video: true })`, stops the stream immediately (we only need the permission grant), then clicks `cameraInputRef`. If permission is denied, show a toast explaining how to enable camera access, and fall back to opening the gallery input.
- Remove the third "Video" button. Rename "Gallery" to "Photo / Video" with a combined icon approach.
- Keep two hidden file inputs: one with `capture="environment"` for camera, one without for gallery.
- Grid changes from `grid-cols-3` to `grid-cols-2`.

This gives you App Store-compliant permission handling (user sees a clear explanation if denied) while removing the confusing duplicate button.

