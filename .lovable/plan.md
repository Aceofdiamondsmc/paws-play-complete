

## Plan: Fix flyer image disappearing before print

### Changes to `src/components/lost-dog/LostDogAlertModal.tsx`

**1. Add 2-second delay before `print()`** (after line 202, before the print call)

Insert a `setTimeout` or `await new Promise(r => setTimeout(r, 2000))` after `waitForImages()` resolves, giving the browser time to fully paint the loaded image.

**2. Delay iframe cleanup to 10+ seconds after print** (lines 204-211)

- Remove the `afterprint` instant cleanup listener
- Change the `setTimeout(cleanup, 60000)` to `setTimeout(cleanup, 10000)` — keeping the iframe alive for 10 seconds so the iOS print spooler can grab the rendered image

**3. Add `image-rendering` CSS to flyer HTML** (in `generateFlyerHTML` in `FlyerTemplate.tsx`)

Add `image-rendering: -webkit-optimize-contrast;` to the `<img>` tag style for the dog photo in the generated HTML, ensuring sharpness on WebKit-based renderers.

### Specific code changes

**`LostDogAlertModal.tsx` lines 202-211** — replace with:
```typescript
await waitForImages();
// Extra delay to ensure images are fully painted
await new Promise(r => setTimeout(r, 2000));

if (iframe.contentWindow) {
  iframe.contentWindow.print();
  // Keep iframe alive for iOS print spooler
  setTimeout(() => {
    try { document.body.removeChild(iframe); } catch {}
  }, 10000);
}
```

**`FlyerTemplate.tsx`** — in `generateFlyerHTML`, add `image-rendering:-webkit-optimize-contrast;` to the avatar `<img>` inline style.

