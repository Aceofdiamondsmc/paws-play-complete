

## Plan: Final flyer hardening

### What is still wrong

I found one important gap in the current fix:

- **Web print** now converts the dog photo to base64 before generating the HTML flyer.
- But the **native/share flyer path still uses raw remote image URLs** inside `FlyerTemplate`.
- Also, `FlyerTemplate` defines `qrImageUrl` in props but the live React component **does not actually use it** yet.
- So the flyer is still inconsistent depending on whether it is rendered through:
  - the generated HTML print path, or
  - the hidden React DOM → `html-to-image` path.

That explains why the flyer can still be “stubborn” even after the first round of fixes.

### Changes to make

#### 1. Unify flyer asset handling in `LostDogAlertModal.tsx`
I will make the flyer use **one shared asset-prep step** for both web and native:
- Preload and convert:
  - dog avatar
  - QR code
- Store them in state as prepared flyer assets
- Reuse those same prepared assets for:
  - `handleWebPrint`
  - `handleNativeShare`
  - the hidden offscreen `FlyerTemplate`

This removes the mismatch where one path is hardened and the other is not.

#### 2. Fix `FlyerTemplate.tsx`
Update the React flyer component so it matches the HTML flyer behavior:
- Actually use `qrImageUrl` when provided
- Always render a fixed photo area
- Show a **visible placeholder block** when avatar conversion fails
- Add explicit black text color / print-safe styling so text never disappears into a blank-looking box

#### 3. Make print/share wait for ready assets
In `LostDogAlertModal.tsx`:
- Prepare flyer assets before printing/sharing
- Prevent the print/share action from running until the assets are ready
- If image conversion fails, continue with the placeholder instead of producing a broken flyer

#### 4. Keep the current good parts
I will keep the parts that are already working:
- 15-second timeout
- image downscaling
- JPEG export
- iOS-friendly delay before print
- keeping the iframe alive for print spooler

### Files to update

| File | Change |
|------|--------|
| `src/components/lost-dog/LostDogAlertModal.tsx` | Prepare flyer avatar + QR once, store them in state, and use them in both web and native flyer flows |
| `src/components/lost-dog/FlyerTemplate.tsx` | Use `qrImageUrl`, add placeholder rendering in the live component, and strengthen print-safe text/image styling |

### Technical details

```text
Current issue:
- web path: prepared base64 assets
- native path: raw remote avatar + raw remote QR
- FlyerTemplate React path ignores qrImageUrl

Result:
- flyer behaves differently by platform/path
- remote assets can still fail in html-to-image / iOS rendering
```

```text
Fix:
1. prepare avatarDataUrl + qrDataUrl once
2. pass both into generateFlyerHTML
3. pass both into offscreen FlyerTemplate
4. if avatar prep fails, render placeholder block instead of blank area
5. wait until flyer assets are ready before print/share
```

### Expected outcome

After this change, the flyer should behave the same way everywhere:
- web preview print
- iPhone/iOS build
- native share/print flow

And if a photo cannot be embedded, the flyer will still be usable with a clear placeholder instead of looking broken.

