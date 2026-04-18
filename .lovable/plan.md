
User uploaded two screenshots showing the bug clearly:
- IMG_0247: drawer opens correctly, header at top, "No comments yet" centered, input at bottom (~85% height). Looks fine.
- IMG_0246: drawer has scrolled UP so the input bar is now glued to the top of the screen, header is gone, huge empty white space below input, keyboard at bottom. This happens BEFORE focusing input.

Wait — re-reading: "scrolls way up to the top... but after hitting the check this is corrected." So IMG_0246 is the broken state (input pinned to top), and tapping the check button (Send) fixes it.

What's happening: On iOS, when the keyboard opens (focus on the comment input), iOS shifts the visual viewport up. Vaul's drawer has `fixed inset-x-0 bottom-0` — when iOS shrinks the viewport for the keyboard, `bottom: 0` is now above the keyboard, but the drawer's content height (`max-h-[80dvh]`) is computed from the ORIGINAL viewport, so the drawer overflows above the screen. The empty comments list (`flex-1`) takes all the leftover space, pushing the header off-screen and pinning the input near the top.

After hitting Send (Check), state changes (clearing input / submitting / re-render) cause the drawer to recompute → snaps back correctly.

Root cause: `max-h-[80dvh]` on `DrawerContent`. iOS Capacitor + keyboard + dvh = unstable. The drawer doesn't resize when keyboard appears; instead it overflows and the bottom-anchored sticky input gets pushed to top of visible area.

### Fix

Edit `src/components/social/CommentsDrawer.tsx`:

1. Change `max-h-[80dvh]` → `h-[85svh]` (small viewport height — iOS treats svh as "smallest" so it stays stable when keyboard opens, OR equivalently use a fixed `h-[80vh]` which doesn't react to keyboard).
2. Remove the `onFocus scrollIntoView` band-aid — no longer needed.
3. Add `overscroll-contain` on the comments scroll area so scroll doesn't chain to the page behind.
4. Use Capacitor Keyboard listener (already installed via plugins? No — not in plugin list). Skip native plugin route; CSS-only fix is enough.

Alternative more robust: use `h-[80vh]` (large viewport height fixed) — drawer keeps its size; iOS will naturally scroll the page so input is visible above keyboard, and since input is at `bottom-0` of the drawer (which is `bottom-0` of viewport), iOS auto-scrolls just enough to reveal it. This is the standard pattern that works on iOS Safari.

### Files
- `src/components/social/CommentsDrawer.tsx` — replace `max-h-[80dvh]` with `h-[80vh]`, remove `onFocus` scrollIntoView handler, add `overscroll-contain` on scroll area.

No other files. No new deps. Pure CSS / handler cleanup. Web behavior preserved (desktop already works fine — `vh` is stable on desktop).

After fix you'll need another iOS build (1.5/117) to test on device.
