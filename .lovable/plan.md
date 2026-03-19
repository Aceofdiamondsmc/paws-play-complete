

## Fix: Lower the Admin Back Arrow on Mobile Devices

### Problem
The `safe-top` class on the admin header adds `padding-top: var(--safe-area-top)` which accounts for the iOS notch, but on native mobile (Capacitor) the safe area inset may not provide enough clearance, leaving the back arrow too high to tap comfortably.

### Solution
Add explicit extra top padding to the header's inner content row so the back button sits lower on mobile, while keeping the `safe-top` background extension for the notch area.

### Changes — `src/components/admin/AdminLayout.tsx`

1. Keep `safe-top` on the `<header>` for background coverage behind the status bar
2. Add `pt-2` (or more) padding to the inner `<div>` on mobile — use a Capacitor/mobile-specific approach:
   - Add a class like `pt-[env(safe-area-inset-top,0px)]` directly on the inner div **in addition** to the outer safe-top, plus a minimum `pt-4` so the button always has breathing room
   - Alternatively, increase the header height on mobile with `min-h-[4rem]` and add `items-end pb-2` so content sits at the bottom of the header area

**Recommended approach**: Replace `safe-top` padding strategy with a more generous inner padding that ensures the button is always reachable:
- Keep `safe-top` on `<header>` for the background fill
- Change the inner div to use `pt-2 sm:pt-0` so on small screens there's always extra spacing pushing the row down

This is a single-line class change in `AdminLayout.tsx`.

