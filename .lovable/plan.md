

## Fix: Backfill Correct Timezone for Existing Reminders

### Problem
The migration defaulted all existing reminders to `America/New_York`. For a West Coast user, this means existing reminders will fire 3 hours too early. New reminders are fine since they capture the browser timezone.

### Solution

**1. Update `src/hooks/useCareReminders.tsx` -- Auto-sync timezone on load**

When reminders are fetched, check if any have a mismatched timezone compared to the user's current browser timezone. If so, batch-update them to the correct timezone. This is a one-time self-healing fix that works for all users regardless of location.

Logic in `fetchReminders`:
```text
After fetching reminders:
1. Get browser timezone via Intl.DateTimeFormat().resolvedOptions().timeZone
2. Find reminders where user_timezone differs from browser timezone
3. Batch-update those reminders with the correct timezone
```

This approach:
- Automatically fixes all existing reminders on next app load
- Works for any timezone, not just Pacific
- No manual database intervention needed
- Only runs the update once (subsequent loads find no mismatches)

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCareReminders.tsx` | Add timezone sync logic after fetching reminders |

