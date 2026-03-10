

## Plan: Real-time Status Updates + Submission Confetti

### Overview
Two enhancements to make the My Suggestions flow feel world-class: (1) real-time Supabase listener so status changes appear instantly with a toast, and (2) a confetti burst animation on successful park submission.

### Changes

**1. `src/components/parks/MySuggestionsList.tsx`** — Add Supabase Realtime listener

- Subscribe to `postgres_changes` on `park_suggestions` table (UPDATE events) filtered to the current user's rows.
- On status change, show a sonner toast with the park name and new status (e.g., "Sunset Park was approved!").
- Call `refetchMySuggestions()` to refresh the list automatically.
- Use `db-` channel prefix per project convention (`db-my-park-suggestions`).
- Cleanup subscription on unmount.
- Add entrance animation via Tailwind `animate-in` on each card for smooth list transitions.

**2. `src/components/parks/SuggestParkModal.tsx`** — Add confetti on successful submission

- Import and render the existing `ConfettiBurst` component on successful submit.
- Show confetti for ~1 second before closing the modal, creating a celebratory moment.
- Also call `refetchMySuggestions()` after submit so the new suggestion appears immediately in the profile sheet.

**3. `src/hooks/useParkSuggestions.tsx`** — No changes needed

The hook already exposes `refetchMySuggestions` via react-query's `refetch`. The realtime listener in the component will call this directly.

### Technical Notes

- Realtime channel uses the naming convention `db-my-park-suggestions` to avoid collisions with table names (per project architecture memory).
- The existing `park_suggestions_select_own` RLS policy ensures users only receive updates for their own rows.
- The `ConfettiBurst` component and its `@keyframes confetti-burst` animation already exist in the codebase.

