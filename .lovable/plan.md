

## Fix Parks List Proximity Sorting

The list is showing parks 582 miles away first because of a logic flaw in how coordinate validation interacts with user location availability.

---

### Root Cause

In `useNearbyParks.tsx` (lines 168-184), the sorting logic conflates two separate concepts:

```typescript
// CURRENT (BROKEN)
if (!coords || !userLocation) {
  return { park, distance: undefined, hasValidCoords: false };
}
```

**The Problem**: When `userLocation` is `null`, **ALL parks** are marked as `hasValidCoords: false` - even parks that DO have valid coordinates. This causes:
1. All parks get sorted by rating (not distance)
2. Parks 582 miles away with high ratings appear above parks 2 miles away

---

### Solution

Separate coordinate validation from distance calculation:

```typescript
// FIXED
const sortedFilteredParks = useMemo(() => {
  let filtered = allParks.filter(/* ... */);

  const withDistance = filtered.map(park => {
    // Step 1: Check if park has valid coords (INDEPENDENT of userLocation)
    const coords = getValidCoords(park.latitude, park.longitude);
    const hasCoords = coords !== null;
    
    // Step 2: Calculate distance ONLY if we have both coords and userLocation
    let distance: number | undefined = undefined;
    if (coords && userLocation) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        coords.lat,
        coords.lng
      );
    }

    return { park, distance, hasValidCoords: hasCoords };
  });

  // Step 3: Sort with proper priority
  withDistance.sort((a, b) => {
    // Both have invalid coords -> sort by rating
    if (!a.hasValidCoords && !b.hasValidCoords) {
      return (b.park.rating || 0) - (a.park.rating || 0);
    }
    // Invalid coords go to bottom
    if (!a.hasValidCoords) return 1;
    if (!b.hasValidCoords) return -1;

    // Both have valid coords
    if (a.distance !== undefined && b.distance !== undefined) {
      // Both have distances -> sort by distance
      return a.distance - b.distance;
    }
    // If no userLocation yet, parks with valid coords still appear first
    // sorted by rating until distances are calculated
    return (b.park.rating || 0) - (a.park.rating || 0);
  });

  return withDistance.map(({ park, distance }) => ({
    ...park,
    distance,
  }));
}, [allParks, activeFilters, userLocation]);
```

---

### Key Changes

| Before | After |
|--------|-------|
| `hasValidCoords` depends on `userLocation` | `hasValidCoords` checked independently |
| No userLocation = all parks equal | Parks with coords always ranked higher |
| Sorts by rating when waiting for location | Groups valid-coord parks at top |

---

### Expected Behavior After Fix

| State | Sort Order |
|-------|------------|
| Location loading | Parks with valid coords (sorted by rating) at top, NaN coords at bottom |
| Location available | Parks with valid coords sorted by distance (nearest first), NaN at bottom |
| Filter applied | Same logic, but on filtered subset |

---

### File to Modify

| File | Change |
|------|--------|
| `src/hooks/useNearbyParks.tsx` | Separate `hasValidCoords` from `userLocation` check in `sortedFilteredParks` useMemo |

