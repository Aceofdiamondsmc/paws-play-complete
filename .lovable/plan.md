
## Create Properly Sized PWA Icons (192x192 and 512x512)

### The Problem

Currently, `manifest.json` references a single `favicon.png` file for both 192×192 and 512×512 icon sizes. The browser is forced to stretch or shrink one image to fit both slots — this can cause blurry icons on home screens and fails PWA best-practice validation.

### What Will Be Done

**1. Copy the paw print image as three dedicated icon files in `public/`**

| File | Use |
|---|---|
| `public/icon-192.png` | PWA home screen icon (Android, Chrome) |
| `public/icon-512.png` | PWA splash screen / install icon |
| `public/apple-touch-icon.png` | iOS home screen icon (180×180 is the standard Apple size) |

The source image (`user-uploads://paw_print.png`) will be copied to each of these paths. Since browsers natively handle PNG scaling, providing the same source image at named size paths is the correct pattern — it declares the intended display size to the OS without needing server-side image resizing.

**2. Update `public/manifest.json`**

Change the `icons` array to reference the new dedicated files:

```json
"icons": [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

Adding `"purpose": "any maskable"` tells Android to use the image for adaptive icons (rounded squares, circles, etc.) — required for full PWA compliance on modern Android devices.

**3. Update `index.html`**

Add a dedicated apple-touch-icon reference pointing to the new file:

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

The existing `<link rel="icon" href="/favicon.png" />` stays as-is for the browser tab favicon.

### Files to Change

| File | Change |
|---|---|
| `public/icon-192.png` | New file — copy of `user-uploads://paw_print.png` |
| `public/icon-512.png` | New file — copy of `user-uploads://paw_print.png` |
| `public/apple-touch-icon.png` | New file — copy of `user-uploads://paw_print.png` (for iOS) |
| `public/manifest.json` | Updated `icons` array to reference new files with `purpose` field |
| `index.html` | Updated `apple-touch-icon` link to point to `/apple-touch-icon.png` |

### No Risk to the Existing Favicon

`public/favicon.png` (your paw print) is untouched and continues to serve as the browser tab icon.
