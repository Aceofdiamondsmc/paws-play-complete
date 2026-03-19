

## Fix: Admin Layout Back Button Accessibility + Route to /me

### Problem
1. The admin header back button sits behind the iOS safe area (notch/Dynamic Island), making it inaccessible without rotating the device
2. The back button navigates to `/parks` instead of `/me`

### Reference
The ChatView component handles this correctly: it applies the `safe-top` class and uses `pt-[60px]` on its header content to push below the safe area.

### Changes — Single File: `src/components/admin/AdminLayout.tsx`

1. **Add `safe-top` class** to the admin header element (line 23) so it respects the iOS safe area inset, matching how `Header.tsx` and `ChatView.tsx` handle it

2. **Change navigation target** on line 29 from `'/parks'` to `'/me'` so admins return to their profile page

