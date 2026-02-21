

## Fix "Add Friend" Tap Causing Page Jump

### The Problem
Tapping "Add Friend" (or any button) on the Pack tab inadvertently triggers the swipe-to-next-dog logic. Here's why:

1. You swipe to see a dog -- `touchEndX` gets set to some value (e.g. 150)
2. You tap "Add Friend" -- `touchStartX` is set to your tap position (e.g. 300), but `touchMove` never fires so `touchEndX` stays at 150
3. `touchEnd` fires -- `diff = 300 - 150 = 150`, which exceeds the 50px threshold, so it navigates to the next dog

### The Fix

**File: `src/pages/Pack.tsx` (line ~294-296, `handleTouchStart`)**

Reset `touchEndX` alongside `touchStartX` when a new touch begins, so a simple tap always produces `diff = 0`:

```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchEndX.current = e.touches[0].clientX;  // <-- add this line
};
```

This single-line fix ensures that if no `touchMove` event fires (i.e., it was a tap, not a swipe), the diff will be 0 and no navigation occurs.

### Summary

| File | Change |
|------|--------|
| `src/pages/Pack.tsx` | Reset `touchEndX` in `handleTouchStart` to prevent taps from triggering swipe navigation |

