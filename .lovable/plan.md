

# Change Default Tab to "Booked" on Dates Page

## Overview

Update the Dates page so that when a logged-in user navigates to the `/dates` route, the "Booked" tab is selected by default instead of "Pending", and booked playdates are displayed immediately.

## Current Behavior

- The Tabs component uses `defaultValue="pending"`
- Users land on the Pending tab first
- Booked playdates require an extra tap to view

## Solution

A single-line change to the `defaultValue` prop of the Tabs component.

## Implementation

### File: `src/pages/Dates.tsx`

**Change on Line 47:**

```text
Before:
<Tabs defaultValue="pending" className="p-4">

After:
<Tabs defaultValue="booked" className="p-4">
```

## Data Fetching

No changes needed to the `usePlaydates` hook. It already:
- Fetches all playdates on component mount via `fetchPlaydates()`
- Filters them into `pendingPlaydates`, `acceptedPlaydates`, and `completedPlaydates`
- The `acceptedPlaydates` array (used by the "Booked" tab) is populated immediately when the page loads

## Summary

| File | Change |
|------|--------|
| `src/pages/Dates.tsx` | Change `defaultValue="pending"` to `defaultValue="booked"` on line 47 |

