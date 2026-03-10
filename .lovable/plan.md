

## Plan: "My Suggestions" Section on Profile Page

### Overview
Add a polished "My Suggestions" card to the Me.tsx profile page (between Health & Vaccines and Admin Dashboard), plus a bottom sheet for detailed viewing. Extend the existing `useParkSuggestions` hook with a `fetchMySuggestions` method instead of creating a new hook.

### Changes

**1. `src/hooks/useParkSuggestions.tsx`** — Add `mySuggestions` state + fetch method
- Add `mySuggestions` state and `fetchMySuggestions()` that queries `park_suggestions` where `user_id = user.id`, ordered by `created_at desc`.
- Auto-fetch on mount when user is authenticated.
- Return `mySuggestions`, `mySuggestionsLoading`, and `fetchMySuggestions`.

**2. New: `src/components/parks/MySuggestionsList.tsx`** — The detail list component
- Renders inside a Sheet (bottom drawer) triggered from the profile page.
- Each suggestion is a card showing: park name, city/state, submitted date, amenity badges, and a prominent status badge.
- Status badges:
  - **Pending**: outline style, amber tint — "Under Review"
  - **Approved**: green tint — "Live on Map!"
  - **Rejected**: destructive style — "Not Approved" with `admin_notes` shown in a subtle callout box.
- Empty state: friendly illustration prompt + CTA to navigate to Parks page.
- Skeleton loading state for polish.

**3. `src/pages/Me.tsx`** — Add "My Suggestions" card
- Import `useParkSuggestions` and the new `MySuggestionsList`.
- Add a card after Health & Vaccines showing suggestion count with a status summary (e.g., "2 pending, 1 approved").
- Tapping opens a Sheet with `MySuggestionsList`.
- Only shown when user has >= 1 suggestion (keeps profile clean for new users).

### UX Polish
- Status badges use color-coded backgrounds (amber/green/red) with icons (Clock, CheckCircle2, XCircle) for instant scannability.
- Approved suggestions show a celebratory "Your park is live!" message.
- Rejected suggestions show admin feedback in a muted callout so it feels constructive, not punitive.
- Amenity chips shown as small muted badges for context.
- Relative timestamps ("3 days ago") via date-fns `formatDistanceToNow`.
- Sheet uses the existing Sheet component pattern from the codebase.

### No database changes needed
The existing RLS policy `park_suggestions_select_own` already allows users to read their own suggestions.

