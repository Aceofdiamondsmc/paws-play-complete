

## Fix: Make Recent Activity Log Scrollable

### Problem

Radix `ScrollArea` requires a fixed height on the root to constrain its internal viewport. Using only `max-h-[300px]` on the `ScrollArea` root doesn't propagate the constraint to the inner viewport div, so the content never actually scrolls.

### Fix

Replace the `ScrollArea` wrapper with a simple `div` using `max-h-[300px] overflow-y-auto`, which reliably enables native scrolling. This is simpler and more predictable for a straightforward scrollable list.

| File | Change |
|------|--------|
| `src/components/dates/CareScheduleSection.tsx` | Replace `<ScrollArea className="max-h-[300px]">` with `<div className="max-h-[300px] overflow-y-auto">`, remove `ScrollArea` import if unused elsewhere |

