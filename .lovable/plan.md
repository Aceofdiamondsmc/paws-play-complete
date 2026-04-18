
The `h-[80vh]` fix didn't hold on iOS Capacitor. Re-diagnosing from scratch.

### What's actually happening

On iOS WebKit inside Capacitor:
- `vh` units are based on the **largest** viewport (no URL bar). When the keyboard opens, the visual viewport shrinks but `vh` does NOT change.
- A drawer with `fixed bottom-0 h-[80vh]` keeps its 80vh size, but `bottom: 0` is anchored to the **layout viewport** bottom, not the **visual viewport** bottom. The keyboard pushes the visual viewport up, leaving the bottom of the drawer (where the input is) hidden under the keyboard — OR iOS auto-scrolls the entire layout viewport up to reveal the focused input, which shoves the drawer's header off the top of the screen. That's exactly what the screenshot shows: input pinned near top, header gone, white space below = the drawer's lower half is now scrolled below the keyboard out of view.
- Switching `dvh` → `vh` didn't help because the root cause isn't the height unit — it's that **`position: fixed` on iOS doesn't follow the visual viewport when the keyboard is open**. iOS scrolls the layout viewport to bring the focused field into view, dragging the entire fixed drawer with it.

### Why "tap Send fixes it"
Tapping Send blurs the input → keyboard dismisses → visual viewport restores → layout viewport scrolls back to 0 → drawer snaps to the correct position.

### The real fix: use VisualViewport API + Capacitor Keyboard plugin

Two layers of defense:

**Layer 1 — Install `@capacitor/keyboard` plugin** and configure it with `resize: "none"` and listen for `keyboardWillShow` to manually pad the drawer's input area by the keyboard height. This is the Capacitor-blessed way and stops iOS's auto-scroll behavior.

Setting `KeyboardResize.None` in `capacitor.config.ts` tells iOS NOT to resize/scroll the webview when the keyboard opens. Then we manually add `padding-bottom: {keyboardHeight}px` to the drawer's input area so the input sits just above the keyboard. The drawer's `position: fixed` now stays glued to the bottom of the screen because iOS isn't moving the viewport anymore.

**Layer 2 — In `CommentsDrawer.tsx`**, subscribe to Keyboard `willShow`/`willHide` events, store keyboard height in state, and apply `paddingBottom: keyboardHeight` to the sticky input wrapper. Also revert drawer height to `max-h-[85dvh]` (it's fine again once iOS stops scrolling the viewport).

### Files to change

1. **`package.json`** (auto via install) — add `@capacitor/keyboard`.
2. **`capacitor.config.ts`** — add:
   ```ts
   plugins: {
     Keyboard: { resize: KeyboardResize.None, style: KeyboardStyle.Default, resizeOnFullScreen: false }
   }
   ```
3. **`src/components/social/CommentsDrawer.tsx`**:
   - Import `Keyboard` from `@capacitor/keyboard` and `Capacitor` from `@capacitor/core`.
   - Add `const [kbHeight, setKbHeight] = useState(0)`.
   - In `useEffect` (when `open` is true and on native platform): register `keyboardWillShow` → `setKbHeight(info.keyboardHeight)`, `keyboardWillHide` → `setKbHeight(0)`. Cleanup on close.
   - Apply `style={{ paddingBottom: kbHeight }}` to the sticky input form wrapper.
   - Restore drawer height to `max-h-[85dvh]`.
4. **User runs**: `npm install` → `npx cap sync ios` → bump to **1.6 (118)** → Appflow build.

### Why this will work
- `KeyboardResize.None` stops iOS from scrolling/resizing the webview when the keyboard appears — the #1 cause of the bug.
- Manual padding ensures the input is visible above the keyboard regardless.
- This is the documented Capacitor pattern for chat/comment UIs and is what apps like WhatsApp/Telegram clones use on Capacitor.

### Risk
- `KeyboardResize.None` is global — applies to ALL inputs in the app (chat, profile edit, etc.). The ChatView already manages its own keyboard layout with `100dvh` and works fine, so this should be neutral or improving everywhere.
- Web is unaffected (Keyboard plugin is a no-op on web; the `Capacitor.isNativePlatform()` guard skips listeners).

After approval I'll make these edits in default mode. You'll then need: pull → `npm install` → `npx cap sync ios` → version bump → Appflow build 118 → TestFlight.
