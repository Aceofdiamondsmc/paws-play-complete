

## Fix: Camera Button on Web

The `getUserMedia` permission check fails or gets blocked in many browsers, preventing the file input from ever opening. The fix: remove the permission pre-check entirely and just click the file input directly. The `capture="environment"` attribute on the input already prompts the browser/OS for camera access natively.

### Change

**`src/components/social/PhotoUploadSheet.tsx`**
- Replace `handleCameraClick` with a direct click on `cameraInputRef` (same pattern Gallery/Video already use)
- Remove the `checkCameraPermission` function entirely

