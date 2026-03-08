

## Plan: Add Per-Item Delete on Historical Playdate Cards

### Changes

**1. `src/hooks/usePlaydates.tsx`** — Add `deletePlaydate` function
- Deletes a single record from `playdate_requests` by ID, then calls `fetchPlaydates()` to refresh.
- Return it from the hook alongside existing functions.

**2. `src/pages/Dates.tsx`** — Wire per-item delete in the "All" tab
- Add a `handleDelete` function that calls `deletePlaydate(id)` with toast feedback.
- In the "All" tab's `playdates.map()`, pass `onDelete` to `PlaydateCard` only for historical statuses (`completed`, `declined`, `cancelled`).
- In the `PlaydateCard` component: accept an `onDelete` prop, render a small Trash2 icon button wrapped in an `AlertDialog` confirmation ("Remove this playdate record?") in the card's action area. Only shown when `onDelete` is provided.

### No database changes needed
The existing DELETE RLS policies already cover both requesters and receivers (added in the last migration).

