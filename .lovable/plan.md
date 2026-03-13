

## Fix: "View all conversations" Button Does Nothing

### Problem
The button on line 91 of `MessageList.tsx` has no `onClick` handler.

### Fix

**`src/components/profile/MessageList.tsx`**:
1. Add a `showAll` state (default `false`)
2. Toggle it on button click
3. When `showAll` is true, render all conversations instead of `.slice(0, 5)`
4. Change button text to "Show less" when expanded

| File | Change |
|------|--------|
| `src/components/profile/MessageList.tsx` | Add `showAll` toggle state, wire button, conditionally slice conversations |

