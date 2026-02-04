

## Fix Missing Distance Badge on ParkCard

The distance badge (e.g., "📍 0.3 mi") is not showing because the `ParkCard` component recalculates distance internally but the `userLocation` prop may not be available on initial render.

---

### Root Cause

There are two issues:

1. **Redundant Calculation**: The `useParksPaginated` hook already calculates and stores `distance` on each `Park` object, but `ParkCard` ignores this and recalculates using `userLocation` prop
2. **Timing Issue**: If `userLocation` is `null` on first render (before geolocation resolves), the distance shows as `undefined` even after location becomes available

---

### Solution

Update `ParkCard` to use the pre-calculated `park.distance` field as the primary source, with `userLocation` recalculation as a fallback:

```typescript
// Calculate distance - prefer pre-calculated from hook, fallback to calculating here
const distance = useMemo(() => {
  // First, use pre-calculated distance from the hook (already in meters)
  if (park.distance !== undefined) {
    return park.distance;
  }
  // Fallback: calculate if userLocation is available but park.distance wasn't set
  if (!userLocation || !park.latitude || !park.longitude) return undefined;
  return calculateDistance(userLocation.lat, userLocation.lng, park.latitude, park.longitude);
}, [park.distance, userLocation, park.latitude, park.longitude]);
```

---

### Why This Works

| Scenario | Result |
|----------|--------|
| Parks fetched with location | `park.distance` is set, badge shows immediately |
| Parks from cache with location | `park.distance` is recalculated in hook, badge shows |
| Parks loaded before location | Fallback calculation kicks in when `userLocation` prop arrives |

---

### File to Modify

| File | Change |
|------|--------|
| `src/components/parks/ParkCard.tsx` | Update distance calculation to use `park.distance` first, then fallback to `userLocation` calculation |

---

### Technical Notes

- `park.distance` is stored in **meters** (from Haversine formula in `useParksPaginated`)
- `formatDistanceMiles()` from `navigation-utils` expects meters and converts to miles/feet
- No changes needed to `useParksPaginated.tsx` - it already calculates and stores distance correctly

