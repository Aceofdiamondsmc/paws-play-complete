

## Fix: Approved Park Not Showing in List View

### Root Cause

The Parks page uses **two separate hooks** that fetch independently:
- **Map**: `useParks()` (line 50) — fetches all parks, uses localStorage cache with background refresh
- **List**: `useNearbyParks()` (line 52-70) — fetches all parks separately, applies 3-tier logic

These two hooks maintain independent copies of the parks data. When one has fresher data than the other (e.g., cache timing, fetch order), they go out of sync. The approved park appears in one but not the other.

### Fix

**Consolidate to a single data source.** Remove the separate `useParks()` call and feed the map from `useNearbyParks` data instead.

**`src/hooks/useNearbyParks.tsx`**:
- Expose `allParks` in the return object (it's already a state variable, just not returned)

**`src/pages/Parks.tsx`**:
- Remove `const mapHook = useParks();` (line 50) and the `useParks` import
- Destructure `allParks` from `useNearbyParks()`
- Pass `allParks` to `<ParksMap>` instead of `mapHook.parks`
- Pass `loading` instead of `mapHook.loading`

This ensures both views always render from the same fetch, eliminating sync issues.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useNearbyParks.tsx` | Add `allParks` to return object |
| `src/pages/Parks.tsx` | Remove `useParks`, use `allParks` from `useNearbyParks` for map |

