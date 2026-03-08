

## Cancel Booked Playdates — Refined Plan

You're correct. Declining pending requests works fine already. The only missing piece is **cancelling an accepted/booked playdate** — which requires:

1. Updating the `playdate_requests` status back (e.g., to `'cancelled'`)
2. Updating the related `playdate_schedules` entry status to `'cancelled'`
3. A UI button + confirmation dialog on booked cards

### RLS Gaps

- **`playdate_requests`**: Only receivers can UPDATE. Requesters need UPDATE access too (to cancel their own booked playdates). There's already a DELETE policy for requesters, but we want a soft cancel, not a hard delete.
- **`playdate_schedules`**: Participants can already UPDATE, so marking the schedule as `'cancelled'` will work. No migration needed here.

### Changes

**1. Database migration** — Add UPDATE policy for requesters on `playdate_requests`:
```sql
CREATE POLICY "Requesters can update own requests"
ON public.playdate_requests FOR UPDATE
USING (requester_id = auth.uid())
WITH CHECK (requester_id = auth.uid());
```

**2. `src/hooks/usePlaydates.tsx`**
- Add `cancelPlaydate(playdateId)` that:
  - Sets `playdate_requests.status` → `'cancelled'`
  - Sets `playdate_schedules.status` → `'cancelled'` for the matching `playdate_request_id`
  - Refreshes the list

**3. `src/pages/Dates.tsx`**
- Add `handleCancel` calling `cancelPlaydate`
- In the **Booked** tab, add a destructive "Cancel" button to each `PlaydateCard`
- Wrap in an `AlertDialog` confirmation ("Cancel this playdate? This cannot be undone.")
- `PlaydateCard`: add `onCancel` prop, render cancel button alongside existing Message button

