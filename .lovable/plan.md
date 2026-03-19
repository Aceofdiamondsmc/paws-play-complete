

## Fix Admin Exit + Flyer on iOS — IMPLEMENTED

### Changes Made

1. **`index.html`** — Added `viewport-fit=cover` to viewport meta so `env(safe-area-inset-top)` resolves correctly on iOS.

2. **`src/components/admin/AdminLayout.tsx`** — Replaced JS `navigate()` with declarative `<Link to="/me">`. Added redundant "Exit" button in the nav bar. Used `max(env(safe-area-inset-top), 12px)` for reliable top padding.

3. **`src/components/lost-dog/LostDogAlertModal.tsx`** — Split into native vs web paths:
   - **Native (Capacitor)**: Renders offscreen `FlyerTemplate` → `html-to-image` JPEG → `Filesystem.writeFile()` to cache → `Share.share()` with `file://` URI → native share sheet with Print option.
   - **Web**: Keeps existing iframe + `window.print()`.
   - Added loading state and error toasts.

4. **`package.json`** — Added `@capacitor/filesystem` (already had `html-to-image` and `@capacitor/share`).

### After Implementation
- `npm install`
- `npx cap sync`
- Trigger new Appflow build
- Test on device: Admin exit and Flyer share/print
