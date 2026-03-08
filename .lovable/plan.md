

## Plan: Add "Clear All History" to the Dates "All" Tab

### Rationale
The "All" tab exposes historical playdate data (partners, locations, dates/times) indefinitely. A privacy-conscious "Clear History" action lets users permanently remove completed, declined, and cancelled records while preserving active ones (pending/accepted).

### What gets cleared
Only playdates with status `completed`, `declined`, or `cancelled`. Pending and accepted playdates are untouched.

### Changes

**1. `src/hooks/usePlaydates.tsx`** — Add a `clearHistory` function
- Deletes from `playdate_requests` where `requester_id = user.id` AND status is in (`completed`, `declined`, `cancelled`).
- Also deletes records where the user owns the receiver dog (they were the other participant).
- Calls `refresh()` after success.

**2. `src/pages/Dates.tsx`** — Add UI in the "All" tab
- When historical playdates exist, show a "Clear History" button (Trash2 icon, ghost/destructive style) in the tab header area.
- Wrap in an `AlertDialog` confirmation: "Clear playdate history? This permanently removes all completed, declined, and cancelled playdates. Active playdates are not affected."
- Wire to the new `clearHistory` function with a success toast.

**3. Database: RLS check**
- The `playdate_requests` table already has a `Requesters can delete own playdate requests` DELETE policy (`requester_id = auth.uid()`).
- For playdates where the user is the *receiver* (not the requester), there is **no DELETE policy**. We need to add one:

```sql
CREATE POLICY "Receivers can delete playdate requests"
ON public.playdate_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dogs
    WHERE dogs.id = playdate_requests.receiver_dog_id
    AND dogs.owner_id = auth.uid()
  )
);
```

This ensures both participants can clear their own history.

### UI Sketch

```text
┌─ All tab ─────────────────────────────┐
│  [Clear History 🗑]   (right-aligned) │
│                                        │
│  PlaydateCard ...                      │
│  PlaydateCard ...                      │
└────────────────────────────────────────┘
```

The button only appears when there are historical (non-active) playdates to clear.

