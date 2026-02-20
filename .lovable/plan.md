
## Replace Header Logo with New Paw Icon

### Where the Logo Is Used

The existing `pawsplay-logo.png` asset is imported and displayed in exactly two places:

| File | Usage |
|---|---|
| `src/components/layout/Header.tsx` | Top app bar shown on all main app pages |
| `src/components/admin/AdminLayout.tsx` | Admin sidebar header |

Both files import the same file: `src/assets/pawsplay-logo.png`.

### What Will Be Done

1. Copy the uploaded image (`Paws_Play_Repeat_full_icon_7-2.png`) into the project, saving it as `src/assets/pawsplay-logo.png` — replacing the existing file in place.

Because both components already import from `@/assets/pawsplay-logo.png`, they will automatically pick up the new image without any code changes required.

### Display Details

- `Header.tsx` renders the logo at `h-10` (40px tall), `w-auto` — the new square paw icon will scale proportionally and sit centered in the 56px header bar.
- `AdminLayout.tsx` renders it at `h-8` (32px tall), `w-auto` — it will appear as a compact icon in the admin sidebar.

### No Other Changes Needed

- No component code needs to change — the import path stays the same
- No changes to `index.html`, favicons, or PWA icons (those use separate files in `public/`)
- No changes to the Landing page (it does not use the pawsplay-logo asset)
