

## Fix: Make Recent Activity Section Actually Scrollable

### Root Cause

The `useCareHistory` hook fetches only **5 entries** (`.limit(5)` on line 74 of `useCareHistory.tsx`). Five compact list items never exceed 300px in height, so there's simply nothing to scroll — the `overflow-y-auto` container works correctly, but the content is always shorter than the max height.

### Fix

| File | Change |
|------|--------|
| `src/hooks/useCareHistory.tsx` | Increase `.limit(5)` to `.limit(50)` so more history entries are available to scroll through |

This is a one-line change. The `max-h-[300px] overflow-y-auto` container from the previous fix will then work as intended once more than ~6 entries exist.

