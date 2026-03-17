

## Remove "Take Photo" from Photo Library / File Picker

The iOS native file picker shows "Photo Library", "Take Photo", and "Choose File" because the `accept` attribute includes `image/*`, which iOS interprets as allowing camera capture.

To suppress the "Take Photo" option, replace the wildcard `image/*` with explicit MIME types so iOS no longer offers the camera:

### Change
- **`src/components/social/PhotoUploadSheet.tsx`** line 236: Change `accept="image/*,.heic,.heif"` to `accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif"`

This tells iOS the input only wants existing image files, not camera capture, so "Take Photo" is removed from the menu while "Photo Library" and "Choose File" remain.

