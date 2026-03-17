

## Findings

1. **Birthday on Pack tab**: Already implemented -- line 467-475 of `Pack.tsx` shows a 🎂 emoji next to the dog's name on their birthday. This is working.

2. **Calendar year navigation**: The `Calendar` component only has month-by-month arrows (ChevronLeft/Right). For a dog born years ago, users must tap backward dozens of times. Fix: add month/year dropdown selectors to the calendar.

3. **Birthday reminder not created on edit**: The auto-create birthday reminder logic (lines 203-214 of `PackMemberForm.tsx`) only runs inside the `else` branch (new dog). When editing an existing dog, the code at line 185-188 just calls `updateDog` and toasts -- no reminder creation. This is the bug.

4. **Multiple dogs**: Each dog edit/add is independent, so fixing the edit path will naturally handle both dogs. When you update Dog A's birthday, it creates Dog A's reminder. When you update Dog B's birthday, it creates Dog B's reminder.

## Plan

### 1. Add year/month dropdowns to the Calendar
**File: `src/components/ui/calendar.tsx`**
- Replace the default caption with a custom component that renders a month dropdown (Jan-Dec) and a year dropdown (2000-current year)
- Uses DayPicker's `captionLayout` or custom `Caption` component
- Allows jumping directly to any month/year without repeated tapping

### 2. Fix birthday reminder creation on dog edit
**File: `src/components/profile/PackMemberForm.tsx`**
- After the `updateDog` call succeeds (line 186-188), add the same birthday reminder logic that exists for new dogs
- Check if `dateOfBirth` is set and differs from `editingDog.date_of_birth` (avoid duplicate reminders)
- Before creating a new reminder, query existing birthday reminders for this dog name to avoid duplicates (or delete the old one first)
- The reminder uses `task_details` like `"Buddy's Birthday"` -- we can match on that to find/replace existing reminders

### Changes Summary
- **`src/components/ui/calendar.tsx`**: Add month/year dropdown navigation
- **`src/components/profile/PackMemberForm.tsx`**: Add birthday reminder creation/update logic in the edit path (lines 185-188), with duplicate detection based on `task_details` matching the dog's name + "Birthday"

