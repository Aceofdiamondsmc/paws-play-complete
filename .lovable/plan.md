

## Problem

In `handleWebPrint` (line 148-219 of `LostDogAlertModal.tsx`), the dog avatar URL is passed directly to the flyer HTML as a raw Supabase storage URL. The QR code is converted to base64 via `toDataUrl()`, but the avatar is not. In the iframe's print context, cross-origin images from Supabase storage fail to load — iOS Safari's print renderer is especially strict about this. The one image that worked was likely already in the browser cache.

## Fix

### File: `src/components/lost-dog/LostDogAlertModal.tsx` (~line 156)

Convert the avatar to a base64 data URL before passing it to `generateFlyerHTML`, using the same `toDataUrl` helper already used for the QR code:

```typescript
// Before (line 156):
const avatarDataUrl = selectedDog.avatar_url;

// After:
let avatarDataUrl = selectedDog.avatar_url;
if (avatarDataUrl) {
  try {
    avatarDataUrl = await toDataUrl(avatarDataUrl);
  } catch {
    // Fall back to original URL if conversion fails
  }
}
```

This is a 3-line change. The `toDataUrl` function (line 87-101) already exists and handles the fetch + FileReader conversion. No other files need changes.

