

## Fix Parks List Sorting After Filter Selection

The current implementation filters parks but does not re-sort the filtered results by distance. This causes parks to appear in an inconsistent order when filters are applied.

---

### Root Cause

The `filteredParks` variable (lines 240-263) uses `.filter()` to remove non-matching parks, but the result maintains the original array order. It should re-sort filtered results by distance after every filter change.

**Current Code (broken):**
```typescript
const filteredParks = parks.filter(park => {
  // Filter logic only - no sorting
});
```

---

### Solution

Convert `filteredParks` to a `useMemo` that:
1. Filters parks based on active filters
2. Re-sorts by distance (nearest first) with valid coordinates at top
3. Falls back to rating for parks without valid coordinates
4. Depends on `activeFilters`, `parks`, and `userLocation`

**Fixed Code:**
```typescript
const filteredParks = useMemo(() => {
  // Step 1: Filter parks based on active filters
  let result = parks.filter(park => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every(filter => {
      switch (filter) {
        case 'fenced': return park.is_fully_fenced;
        case 'water': return park.has_water_station;
        case 'small-dogs': return park.has_small_dog_area;
        case 'large-dogs': return park.has_large_dog_area;
        case 'agility': return park.has_agility_equipment;
        case 'parking': return park.has_parking;
        case 'grass': return park.has_grass_surface;
        default: return true;
      }
    });
  });

  // Step 2: Recalculate distance and re-sort by proximity
  if (userLocation) {
    result = result.map(park => ({
      ...park,
      distance: hasValidCoords(park.latitude, park.longitude)
        ? calculateDistance(userLocation.lat, userLocation.lng, park.latitude!, park.longitude!)
        : undefined
    })).sort((a, b) => {
      // Parks without valid coordinates go to bottom
      if (a.distance === undefined && b.distance === undefined) {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      // Sort by distance ascending (nearest first)
      return a.distance - b.distance;
    });
  } else {
    // No location - sort by rating descending
    result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return result;
}, [parks, activeFilters, userLocation]);
```

---

### Key Changes

| Change | Purpose |
|--------|---------|
| Convert to `useMemo` | Re-compute filtered + sorted list when dependencies change |
| Add `userLocation` dependency | Re-sort when user location updates |
| Recalculate distance in filter | Ensure distance is always current with user location |
| Sort after filtering | Guarantee nearest parks appear first after filter |
| Handle undefined distance | Push parks with NaN/missing coords to bottom |

---

### Hook Signature Update

The hook needs access to `userLocation` inside the memoization. Since `userLocation` is already passed to the hook, we just need to use it in the `useMemo` dependencies.

---

### File to Modify

| File | Changes |
|------|---------|
| `src/hooks/useParksPaginated.tsx` | Refactor `filteredParks` from plain filter to `useMemo` with distance recalculation and proximity sorting |

---

### Result

| Scenario | Before | After |
|----------|--------|-------|
| No filters active | Sorted by distance | Sorted by distance (no change) |
| Filter "Fully Fenced" selected | Random order after filter | Re-sorted by distance (nearest fenced parks first) |
| Filter changed while moving | Stale distance values | Fresh distance from current location |
| Parks with NaN coordinates | Mixed in with valid parks | Always at bottom of list |

