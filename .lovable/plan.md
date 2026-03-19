

## Fix Admin Exit + Flyer on iOS (Revised)

### Problem Recap
1. **Admin exit**: `viewport-fit=cover` is missing from `index.html`, so `env(safe-area-inset-top)` resolves to `0` on iOS. The back button sits under the notch/status bar and is untappable.
2. **Flyer print**: `window.print()` inside an iframe is a no-op in iOS WKWebView. The button does nothing.

### Changes

#### 1. `index.html` — Add `viewport-fit=cover`
Update the viewport meta tag to include `viewport-fit=cover` so iOS safe-area env values actually work.

#### 2. `src/components/admin/AdminLayout.tsx` — Reliable exit
- Use a `<Link to="/me">` instead of a JS `navigate()` handler (declarative routing works even if JS event handling has issues in the safe-area).
- Add a second, always-visible "Exit Admin" button below the header (inside the nav bar area) as a failsafe escape hatch.
- Use `pt-[max(env(safe-area-inset-top),12px)]` to guarantee minimum top padding even if env values are partially broken.

#### 3. Install `@capacitor/filesystem`
Yes — this is required. iOS needs a real `file://` URI for the share sheet's Print option to appear. The flow will be:
1. Render flyer HTML in a hidden div
2. Convert to JPEG via `html-to-image`
3. Write to temp file via `@capacitor/filesystem` → get `file://` URI
4. Open native share sheet via `@capacitor/share` with the file URI

Without Filesystem, we can only pass a base64 data URI to Share, which iOS often strips the Print option from.

#### 4. `src/components/lost-dog/LostDogAlertModal.tsx` — Native share flow
- Detect native Capacitor environment (`Capacitor.isNativePlatform()`).
- **Native path**: Render flyer as an offscreen DOM element → `html-to-image` to generate JPEG blob → `Filesystem.writeFile()` to cache directory → `Share.share({ url: fileUri })` → native share sheet with Print option.
- **Web path**: Keep existing iframe + `window.print()` (works fine on desktop browsers).
- Add toast feedback on success/error so the button never silently fails.

#### 5. Install `html-to-image`
Needed to convert the flyer HTML to a high-res image for the native share flow.

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `@capacitor/filesystem`, `html-to-image` |
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/components/admin/AdminLayout.tsx` | Declarative Link exit + redundant exit button + safe-area fix |
| `src/components/lost-dog/LostDogAlertModal.tsx` | Native Capacitor share/print flow with Filesystem + Share |

### After Implementation
- Run `npm install`
- Run `npx cap sync`
- Trigger new Appflow build
- Test on device: Admin exit and Flyer share/print

