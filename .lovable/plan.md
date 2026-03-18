

## Fix: Lost Dog Alert Flyer — Complete Rewrite of Print/Download Logic

### Problems Identified

1. **Print is completely broken**: `handlePrint` opens `/social?print=true`, but Social.tsx has no flyer rendering logic for that param — it just shows the regular social feed with the header hidden. No dog data is passed via URL.
2. **FlyerTemplate renders outside DialogContent**: It's placed after `</DialogContent>` but still inside `<Dialog>`, so it may not be visible in the DOM at all.
3. **Google Charts QR API is deprecated**: The `chart.googleapis.com` QR endpoint no longer works, so QR codes on flyers are broken.
4. **No data pathway**: Even if the print route worked, there's no mechanism to pass the dog's name, photo, phone number, etc. to the print page.

### Solution

Replace the entire print approach with a self-contained, cross-platform method that works on web and iOS/Android native (Apple-approval safe):

**How it works**: On "Print Flyer" tap, open a **new browser window** containing a standalone HTML page with the flyer content, then trigger `window.print()` on it. This avoids routing, auth guards, and data-passing issues entirely.

#### File Changes

**1. `src/components/lost-dog/FlyerTemplate.tsx`**
- Replace Google Charts QR URL with `https://api.qrserver.com/v1/create-qr-code/` (free, reliable, no API key needed).
- Add an **exported helper function** `generateFlyerHTML(props)` that returns a complete standalone HTML string (inline styles, no Tailwind dependency) for the flyer — suitable for writing into a new window.
- Keep the React component for any in-app preview use.

**2. `src/components/lost-dog/LostDogAlertModal.tsx`**
- Remove the broken `handlePrint` that opens `/social?print=true`.
- Remove unused `Share` and `Browser` Capacitor imports.
- New `handlePrint` logic:
  - Call `generateFlyerHTML()` with the current dog data.
  - Open `window.open('')`, write the HTML string into it, call `window.print()`.
  - On native (Capacitor), use the same approach via `Browser.open` with a data URI or blob URL, which iOS Safari handles natively for print.
- Remove the orphaned `<FlyerTemplate>` rendered outside `DialogContent`.

**3. `src/pages/Social.tsx`**
- Remove the `isPrinting` / `print=true` logic entirely (lines ~212-228 guard bypass, line ~390 header hiding). This dead code path is no longer needed and was a security hole (bypassed auth).

### Why This Works for Apple Review
- No broken buttons — "Print Flyer" produces a real printable page every time.
- No external dependencies that could fail (deprecated APIs).
- Works identically on web, iOS WKWebView, and Android WebView.
- No auth bypass hacks in Social.tsx.

