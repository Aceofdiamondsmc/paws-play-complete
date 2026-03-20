

## Assessment: The fetch/blob approach won't fix this

The fetch/blob code you suggested is **identical to the original `toDataUrl` that was already in the file** before any changes. It was the code that wasn't working in the first place — that's why the photo was missing.

The core problem: both `fetch()` and canvas approaches fail when CORS blocks the request. When they fail, line 158 silently catches the error and keeps the original Supabase URL — but the iframe may also fail to render it.

## Better Plan

The simplest, most reliable fix: **skip base64 conversion for the avatar entirely**. An `<img src="https://supabase-storage-url/...">` inside the print iframe will load the image normally — `<img>` tags are **not subject to CORS** for display purposes. Only `fetch()` and canvas with `crossOrigin` care about CORS headers.

### Change in `src/components/lost-dog/LostDogAlertModal.tsx`

In `handleWebPrint` (~lines 156-159), remove the avatar base64 conversion attempt and pass the original URL directly:

```typescript
// Before (tries to convert, silently fails):
let avatarDataUrl: string | null = selectedDog.avatar_url;
if (avatarDataUrl) {
  try { avatarDataUrl = await toDataUrl(avatarDataUrl); } catch { /* keep original */ }
}

// After (just use the URL directly):
const avatarDataUrl = selectedDog.avatar_url;
```

Keep the QR code conversion since that's a different API. The `toDataUrl` function stays for QR use only.

### Why this works
- `<img>` tags in the iframe load cross-origin images without CORS restrictions
- The print dialog captures rendered images regardless of origin
- No conversion = no failure point

