

## Fix: Flyer Images Not Rendering in Print Preview

### Root Cause
The flyer is rendered inside a hidden iframe. The dog photo (hosted on Supabase storage) and the QR code (from `api.qrserver.com`) are referenced as external URLs. The iframe's security context blocks these cross-origin image loads, so they appear blank when printing.

### Solution
Convert both images to **base64 data URLs** before injecting them into the flyer HTML. This embeds the image data directly in the document, eliminating cross-origin issues.

### Changes — `src/components/lost-dog/LostDogAlertModal.tsx`

1. Make `handlePrint` an `async` function.
2. Before calling `generateFlyerHTML`, fetch and convert images to base64:
   - **Dog avatar**: `fetch(avatarUrl)` → blob → `FileReader.readAsDataURL()` → data URL string.
   - **QR code**: Same process for the QR API URL.
3. Pass the base64 data URLs (instead of the original URLs) to `generateFlyerHTML`.

```typescript
const handlePrint = async () => {
  if (!selectedDog) return;

  // Helper to convert URL to base64
  const toDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  let avatarDataUrl = selectedDog.avatar_url;
  if (avatarDataUrl) {
    try { avatarDataUrl = await toDataUrl(avatarDataUrl); } catch {}
  }

  const html = generateFlyerHTML({
    ...props,
    avatarUrl: avatarDataUrl,  // now base64
    ...
  });
  // rest stays the same
};
```

### Files Modified
- `src/components/lost-dog/LostDogAlertModal.tsx` — make `handlePrint` async, add `toDataUrl` helper, convert avatar + QR images before generating HTML

