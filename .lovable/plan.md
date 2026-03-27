

## Replace Web/PWA Icons with New App Icon

### What
Copy the uploaded paw print icon to the `public/` directory and generate the required sizes for favicon, PWA icons, and Apple touch icon — so web notifications, PWA installs, and browser tabs all show the new branding.

### Changes

| File | Action |
|---|---|
| `public/favicon.png` | Replace with uploaded icon |
| `public/icon-192.png` | Replace with uploaded icon |
| `public/icon-512.png` | Replace with uploaded icon |
| `public/apple-touch-icon.png` | Replace with uploaded icon |
| `index.html` | Confirm favicon link points to `/favicon.png` (likely already correct) |

The uploaded image is 1024x1024 which is perfect — it will be copied as-is for the larger sizes and the browser handles scaling. For best results at small sizes (favicon), a resized version would be ideal, but browsers handle downscaling well from a clean 1024px source.

### No other changes needed
- Native iOS already uses the icon from `AppIcon.appiconset` (separate Xcode asset)
- `manifest.json` already references `/icon-192.png` and `/icon-512.png`
- No iOS build needed

