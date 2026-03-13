

## Two Fixes: Park Visibility in List + Park Preview Panel

### Issue 1: Approved Park Not Showing in List

**Root cause**: The `approve_park_suggestion` RPC does not set `added_by` on the inserted park, and the 3-tier discovery logic in `useNearbyParks` may push the park to Tier 3 (hidden behind "Show More") if its city/state don't match the user's detected location exactly.

**Fix**:
- **SQL migration**: Update `approve_park_suggestion` to set `added_by = _suggestion.user_id` so we can identify user-submitted parks.
- **`useNearbyParks`**: Import `useAuth`, and in the tier-categorization loop, promote parks where `added_by` matches the current user's ID to Tier 2 (always visible, never hidden behind "Show More"). These get a "Your Park" treatment.
- **`ParkListItem`**: Show a small "You Added" badge when the park's `added_by` matches the logged-in user.

### Issue 2: Park Preview Panel on Tap

**Design**: Tapping anywhere on a park list item (except the "Go" button) opens a slide-up preview sheet showing detailed park info. Closes with an X. The "Go" button stays separate and navigates directly.

**Implementation**:
- **`ParkListItem`**: Wrap the item in a clickable area (with `e.stopPropagation` on the Go button). On click, set a `selectedPark` state.
- **New `ParkPreviewSheet` component**: A bottom sheet (using the existing Drawer/Sheet component) that shows:
  - Park image (large)
  - Name, address, city/state
  - Rating with star count
  - Distance if available
  - All feature badges (fenced, water, etc.)
  - AI-generated description (reusing the `generate-park-description` edge function, same as `ParkInfoPanel`)
  - A "Navigate" button at the bottom
  - X close button in the corner
- **`Parks.tsx`**: Add `selectedPark` state, pass `onSelect` to `ParkListItem`, render `ParkPreviewSheet` when a park is selected.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Update `approve_park_suggestion` to set `added_by` |
| `src/hooks/useNearbyParks.tsx` | Import useAuth, promote user's own parks to Tier 2 |
| `src/components/parks/ParkListItem.tsx` | Add onClick handler + "You Added" badge, stop propagation on Go |
| `src/components/parks/ParkPreviewSheet.tsx` | New — bottom sheet with park details + AI summary |
| `src/pages/Parks.tsx` | Add selectedPark state, wire up preview sheet |

