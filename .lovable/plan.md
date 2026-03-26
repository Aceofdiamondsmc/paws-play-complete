

## Fix Comments Drawer — Input Too High / Hard to See What You're Typing

### Problem
The `CommentsDrawer` uses a bottom-up `Drawer` with `max-h-[85vh]`. On mobile, when the keyboard opens, the drawer doesn't adapt — the input stays high up and the user can barely see what they're typing. This is the same issue previously fixed in ChatView and other pages.

### Solution
Apply the same `100dvh`-aware pattern used in ChatView:

**File: `src/components/social/CommentsDrawer.tsx`**

1. Change `DrawerContent` from `max-h-[85vh]` to `max-h-[80dvh]` — uses dynamic viewport height so the drawer shrinks when the mobile keyboard opens
2. Add safe-area bottom padding to the input area: `pb-[env(safe-area-inset-bottom)]` so it clears the home indicator
3. Keep the existing `scrollIntoView` on focus (line 239) which already handles scrolling the input into view after 300ms

This is a single-line class change — same pattern as every other keyboard-aware fix in the app.

### Changes

| What | Where |
|---|---|
| `max-h-[85vh]` → `max-h-[80dvh]` | Line 110, DrawerContent className |
| Add `pb-[env(safe-area-inset-bottom)]` to input container | Line 188 |

No other files affected. No iOS build needed.

