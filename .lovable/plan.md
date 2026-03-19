

## Fix Lost Dog Flyer: Web Blank Page + Mobile Non-Functional

### Problems Identified

1. **Web — blank page after 2 seconds**: The iframe approach has a race condition. `doc.write()` + `doc.close()` triggers the iframe's `onload` immediately (since the content is already written), but the `window.onload` script inside the HTML *also* calls `window.print()`. After `doc.close()`, the browser may fire `onload` before images finish loading, and the double-print-trigger plus the 1-second cleanup `setTimeout` removes the iframe too early, leaving a blank print preview.

2. **Mobile (Capacitor/iOS) — nothing happens**: `iframe.contentWindow?.print()` is not supported in WKWebView (Capacitor's iOS webview). The `window.print()` API simply does nothing on native iOS apps. The Web Share API or a downloadable image/PDF approach is needed instead.

### Plan

#### File: `src/components/lost-dog/LostDogAlertModal.tsx` — rewrite `handlePrint`

**Web fix:**
- Remove the `window.onload = function() { window.print(); }` from the generated HTML (in `FlyerTemplate.tsx`)
- In `handlePrint`, wait for all images inside the iframe to load before calling `print()`
- Use `afterprint` event (or a longer timeout) to clean up the iframe — not a fixed 1-second delay
- Do NOT remove the iframe until print dialog closes

**Mobile fix:**
- Detect Capacitor native environment using `window.Capacitor?.isNativePlatform()`
- On native: instead of iframe print, use `html2canvas` or a simpler approach — render the flyer HTML into a `Blob`, then use the **Web Share API** (`navigator.share({ files: [...] })`) to let the user save/share the flyer as an image, OR simply open the HTML in the system browser via `import { Browser } from '@capacitor/browser'` which supports printing natively
- Simplest reliable approach: on native, open the flyer HTML as a data URL in the Capacitor Browser plugin, which has full print support

#### File: `src/components/lost-dog/FlyerTemplate.tsx`

- Remove the `<script>window.onload = function() { window.print(); };</script>` line — printing is now controlled by the caller
- Add a `printOnLoad` parameter to optionally include the auto-print script (for any future standalone use)

#### File: `src/components/lost-dog/LostDogAlertModal.tsx` — button spacing

- Add `gap-3` (instead of `gap-2`) between the "Download / Print Flyer" and "Got it" buttons to increase tap target separation on mobile

### Summary of Changes

| File | Change |
|------|--------|
| `FlyerTemplate.tsx` | Remove auto-print script from generated HTML |
| `LostDogAlertModal.tsx` | Fix iframe print flow (wait for images, use `afterprint` for cleanup); add Capacitor Browser fallback for native; increase button gap |

