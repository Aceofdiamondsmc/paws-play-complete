
## Use Paw Print Image as the Site Icon

This replaces the previous icon choice (the pug logo) with the new fluffy paw print image (`user-uploads://paw_print.png`).

### What Will Be Done

**1. Copy the paw print to the public folder**
- Copy `user-uploads://paw_print.png` → `public/favicon.png`
- This overwrites the current favicon with the new paw print image
- `index.html` and `manifest.json` already reference `/favicon.png` — no HTML changes needed for the icon

**2. Fix OG image URLs to be absolute (same fix as before)**
- Update `index.html` `og:image` and `twitter:image` meta tags to use the full absolute URL: `https://pawsplayrepeat.lovable.app/og-image.png`
- This is required for Google and social crawlers to correctly pick up and display your brand image in search results

### Files to Change

| File | Change |
|------|--------|
| `public/favicon.png` | Replaced with `user-uploads://paw_print.png` |
| `index.html` | OG image meta tag URLs changed from relative (`/og-image.png`) to absolute (`https://pawsplayrepeat.lovable.app/og-image.png`) |

### No Other Files Needed
- `public/manifest.json` already references `/favicon.png` for PWA icons (192x192, 512x512) — no change needed
- `index.html` already has `<link rel="icon" type="image/png" href="/favicon.png" />` — no change needed

### About Reverting
As confirmed earlier, the **History** tab lets you roll back to any previous version at any time — including the current favicon — with a single click.

### Note on Google's Cache
After publishing, Google may take a few days to re-crawl and update the icon shown in search results. You can speed this up by submitting your URL in [Google Search Console](https://search.google.com/search-console) and requesting re-indexing.
