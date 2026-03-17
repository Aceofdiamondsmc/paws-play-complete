

## Problem

The `getUserMedia` call is causing two issues:

1. **Camera button breaks**: `getUserMedia` opens a live webcam stream, then stops it. By the time it calls `cameraInputRef.current?.click()`, the browser no longer considers this a direct user gesture, so the file input click is silently blocked.
2. **Redundant permission**: The `capture="environment"` attribute on the file input already triggers the OS-level camera permission prompt when clicked. The `getUserMedia` pre-check is unnecessary and actively harmful.

## Fix

**`src/components/social/PhotoUploadSheet.tsx`** -- Remove the `getUserMedia` permission gate entirely. Just click the file input directly. The `capture="environment"` attribute handles everything: the browser/OS will prompt for camera permission natively when the input opens, and the user gets the camera interface.

```typescript
const handleCameraClick = () => {
  cameraInputRef.current?.click();
};
```

That's it. The `capture="environment"` attribute is the correct web standard for "open the camera." No `getUserMedia` needed -- that API is for live video streaming, not file capture.

Both buttons will work the same way (direct click on a hidden file input), but the Camera input has `capture="environment"` which tells the OS to open the camera, while the Photo/Video input opens the gallery.

