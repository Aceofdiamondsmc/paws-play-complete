
## Replace All Icons with PawsPlayRepeat_icon5.png

### What Will Be Done

Copy `user-uploads://PawsPlayRepeat_icon5.png` to all four icon files in `public/`. This is the same approach used previously — the new fluffy green paw print icon will appear everywhere: browser tab, Android home screen, iOS bookmark, and PWA splash screen.

### Files to Change

| File | Change |
|---|---|
| `public/favicon.png` | Overwrite with `PawsPlayRepeat_icon5.png` (browser tab icon) |
| `public/icon-192.png` | Overwrite with `PawsPlayRepeat_icon5.png` (Android PWA 192x192) |
| `public/icon-512.png` | Overwrite with `PawsPlayRepeat_icon5.png` (Android PWA 512x512 — largest slot) |
| `public/apple-touch-icon.png` | Overwrite with `PawsPlayRepeat_icon5.png` (iOS home screen) |

No changes needed to `manifest.json` or `index.html` — those already correctly reference these file paths.

### Cache Note

After the files are replaced:
- Hard refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) to see the new favicon in the tab
- Remove and re-add the app to your home screen to see the updated PWA icon
