

## Fix: Input Fields Hidden by Mobile Keyboard

### Problem
On mobile devices, when the virtual keyboard opens, the text input areas in the **Social post form**, **Chat messages**, and **Comments drawer** get pushed behind the keyboard or bottom navigation bar, making it impossible to see what you're typing.

### Root Causes
1. **ChatView**: Uses `fixed inset-0` layout but the input form at the bottom doesn't account for the virtual keyboard resizing the viewport.
2. **CreatePostForm / Social page**: The textarea is inline in a scrollable page with `pb-24` for the bottom nav, but when the keyboard opens the textarea doesn't scroll into view.
3. **CommentsDrawer**: Similar issue -- the sticky input at the bottom can be obscured.
4. **BottomNav**: The fixed bottom nav (z-50, h-20) sits on top of inputs when the keyboard is open.

### Solution

#### 1. Add a global CSS fix for mobile keyboard behavior
In `src/index.css`, add styles that:
- Hide the bottom nav when an input/textarea is focused (keyboard is open)
- Use `100dvh` (dynamic viewport height) where appropriate so layouts adapt when the keyboard appears

#### 2. Update `src/components/layout/BottomNav.tsx`
- Add a state that tracks whether an input is focused anywhere in the app
- Hide the bottom nav when the keyboard is likely open (input focused) to free up screen space
- Use a `focusin`/`focusout` event listener on `document` to detect input focus

#### 3. Update `src/components/profile/ChatView.tsx`
- Change the outer container from `fixed inset-0` to use `100dvh` height so it shrinks when the mobile keyboard opens
- Add `pb-safe` or safe-area padding to the input form
- Auto-scroll to bottom when the input is focused (keyboard opens)

#### 4. Update `src/components/social/CreatePostForm.tsx`
- Add an `onFocus` handler to the textarea that scrolls it into view after a short delay (to wait for the keyboard animation)
- This ensures the user can always see what they're typing

#### 5. Update `src/components/social/CommentsDrawer.tsx`
- Add an `onFocus` handler to the comment input that scrolls the input into view
- Ensure the drawer's sticky input remains visible above the keyboard

### Technical Details

**BottomNav keyboard detection:**
```typescript
// Listen for focusin/focusout on input/textarea elements
useEffect(() => {
  const onFocusIn = (e: FocusEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      setKeyboardOpen(true);
    }
  };
  const onFocusOut = () => setKeyboardOpen(false);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  return () => { ... };
}, []);
// When keyboardOpen is true, hide the nav with display:none or translate-y
```

**ChatView fix:**
```
- className="fixed inset-0 z-[60] ..."
+ className="fixed inset-x-0 top-0 z-[60] flex flex-col" style={{ height: '100dvh' }}
```
Plus adding a `visualViewport` resize listener to re-scroll to bottom when the keyboard opens.

**CreatePostForm textarea scroll-into-view:**
```tsx
<Textarea
  onFocus={(e) => {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }}
  ...
/>
```

**CommentsDrawer input scroll-into-view:**
```tsx
<Input
  onFocus={(e) => {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }}
  ...
/>
```

### Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `dvh` utility and keyboard-aware CSS |
| `src/components/layout/BottomNav.tsx` | Hide nav when keyboard is open |
| `src/components/profile/ChatView.tsx` | Use `100dvh`, scroll-on-focus |
| `src/components/social/CreatePostForm.tsx` | Scroll textarea into view on focus |
| `src/components/social/CommentsDrawer.tsx` | Scroll input into view on focus |
