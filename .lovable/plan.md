

## Update Header Logo to New App Icon

### Problem
The header still uses the old `pawsplay-logo.png` text-style logo (1.6MB). The new app icon (`public/favicon.png` / `public/icon-192.png`) was added but never swapped into the header.

### Change

| File | Change |
|---|---|
| `src/components/layout/Header.tsx` | Replace `pawsplay-logo.png` import with `/icon-192.png` from public directory. Adjust sizing to `h-9 w-9 rounded-xl` for a clean icon look, optionally add the app name text next to it. |

### Result
The header will show the new round app icon instead of the old text logo, matching the native iOS/Android app icon.

