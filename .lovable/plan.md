

## Plan: Add "Playdate" to Status Labels

A simple text change in two places — the preview card chip and the status badge on playdate cards.

### Changes in `src/pages/Dates.tsx`

1. **Preview card chip** (line 173): Change `"Accepted"` → `"Playdate Accepted"`
2. **Status badge** (line 412): Change `{playdate.status}` to display `"Playdate Accepted"` when status is `accepted`, and similarly prefix other statuses (e.g. `"Playdate Pending"`, `"Playdate Declined"`)

Both are purely text changes — no layout, styling, or logic alterations.

