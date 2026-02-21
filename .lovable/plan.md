

## Update manifest.json for iOS PWA Background Priority

**What**: Add `display_override` field and verify icon `purpose` values in `manifest.json` to improve iOS PWA recognition as a high-priority background process.

**Why**: The `display_override` property tells the browser to try `standalone` mode first (before falling back to `display`), which newer browsers and iOS use for enhanced PWA capabilities. The `purpose: "any maskable"` is already present but will be confirmed.

### Changes

**File: `public/manifest.json`**

Add `"display_override": ["standalone"]` to the manifest. The existing `display: "standalone"` and icon `purpose: "any maskable"` values are already correct and will remain unchanged.

Updated manifest will look like:

```json
{
  "name": "Paws Play Repeat",
  "short_name": "PawsPlay",
  "description": "Connect with fellow pet parents",
  "start_url": "/",
  "display": "standalone",
  "display_override": ["standalone"],
  "background_color": "#1a1f2e",
  "theme_color": "#4ECDC4",
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
}
```

Single-file change -- only adding the `display_override` line.

