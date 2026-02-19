
## Replace All Icons with New Paw Print Image (Paw_Print_icon3.png)

### What Will Be Done

Copy `user-uploads://Paw_Print_icon3.png` to all four icon files in `public/`. This ensures the new fluffy paw print is used everywhere — browser tab, Android home screen, iOS bookmark, and PWA splash screen — at the largest declared size.

### Files to Change

| File | Change |
|---|---|
| `public/favicon.png` | Overwrite with `Paw_Print_icon3.png` (browser tab icon) |
| `public/icon-192.png` | Overwrite with `Paw_Print_icon3.png` (Android PWA 192x192) |
| `public/icon-512.png` | Overwrite with `Paw_Print_icon3.png` (Android PWA 512x512 — largest slot) |
| `public/apple-touch-icon.png` | Overwrite with `Paw_Print_icon3.png` (iOS home screen) |

No changes needed to `manifest.json` or `index.html` — those already correctly reference these file paths.

### Why "As Big As Possible" Is Already Handled

The 512x512 slot in the manifest is the largest standard PWA icon size. The OS will scale up from 192 and down from 512 as needed. By providing the image at both slots, the OS always picks the best fit — no quality is lost.

### Note on Cache

After the files are replaced, you may need to:
- Hard refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) to see the new favicon in the tab
- Remove and re-add the app to your home screen to see the updated PWA icon
