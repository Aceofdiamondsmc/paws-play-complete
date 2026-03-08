

## Add "Out of Stock" Quick Log Button

A simple UI-only change — no database migration needed since both buttons use the existing `restock` category, differentiated by `task_details`.

### Changes in `src/components/dates/CareScheduleSection.tsx`

1. **Add a new Quick Log button** next to "Food Restock":
   - Icon: `AlertTriangle` (already imported)
   - Label: "Out of Stock"
   - Logs with `category: 'restock'` and `task_details: 'Out of stock'`

2. **Update the existing "Food Restock" button** to pass `task_details: 'Restocked'` so the two are distinguishable in the activity log.

3. **Update Recent Activity display** for the `restock` category to show the `task_details` value (e.g., "Restocked" or "Out of stock") instead of the generic "Food Restocked" fallback.

No database changes required — `restock` is already in the CHECK constraint.

