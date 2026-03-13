

## Make the Recent Activity Log Scrollable

The "Recent Activity" section at the bottom of the Care Schedule in the Dates tab renders all history entries in an unbounded list. When many activities are logged, it pushes the page content very long and the bottom nav can obscure entries.

### Fix

Wrap the activity list in a `ScrollArea` with a fixed max height (~300px), so it becomes scrollable when there are many entries.

### File Changed

| File | Change |
|------|--------|
| `src/components/dates/CareScheduleSection.tsx` | Import `ScrollArea` and wrap the `history.map(...)` block in `<ScrollArea className="max-h-[300px]">` |

