

## Strict Proximity Sorting with 50-Mile Cutoff

The current logic is correct but limited by data quality: **692 of 715 parks (97%) have "NaN" coordinates**. This means only 23 parks can be sorted by GPS distance. The remaining parks fall back to rating-based sorting, which puts highly-rated distant parks above local parks without geodata.

---

### Solution: Two-Tier Approach

**Tier 1: GPS-Based (Parks with Valid Coordinates)**
- Calculate distance using Haversine formula
- Apply 50-mile cutoff (80,467 meters) - parks beyond this go to the "far" section
- Sort strictly by distance (nearest first)

**Tier 2: City/State Fallback (Parks with NaN Coordinates)**
- Check if park's `city` or `state` matches user's reverse-geocoded location
- Local matches appear above non-local parks
- Sort by rating within each group

---

### Implementation

**1. Add 50-Mile Cutoff Constant**
```typescript
const MAX_LOCAL_DISTANCE = 80467; // 50 miles in meters
```

**2. Categorize Parks in useMemo**
```typescript
const sortedFilteredParks = useMemo(() => {
  // Filter by activeFilters first
  let filtered = allParks.filter(/* existing filter logic */);

  // Categorize into local vs far
  const categorized = filtered.map(park => {
    const coords = getValidCoords(park.latitude, park.longitude);
    let distance: number | undefined;
    let isLocal = false;

    if (coords && userLocation) {
      distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        coords.lat, coords.lng
      );
      isLocal = distance <= MAX_LOCAL_DISTANCE;
    }

    return { park, distance, hasCoords: coords !== null, isLocal };
  });

  // Sort: Local with distance -> Local without distance -> Far with distance -> Far without distance
  categorized.sort((a, b) => {
    // Local parks first
    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;

    // Within same locality tier, sort by distance if available
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }

    // Parks with coords before parks without
    if (a.hasCoords && !b.hasCoords) return -1;
    if (!a.hasCoords && b.hasCoords) return 1;

    // Fallback to rating
    return (b.park.rating || 0) - (a.park.rating || 0);
  });

  return categorized.map(({ park, distance }) => ({ ...park, distance }));
}, [allParks, activeFilters, userLocation]);
```

**3. Update UI to Show "Local" vs "More Parks" Sections**
- Add a visual separator in the list between local (within 50 miles) and distant parks
- Show "X parks within 50 miles" badge

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useNearbyParks.tsx` | Add 50-mile cutoff, categorize parks, update sort logic |
| `src/pages/Parks.tsx` | Add section headers for "Nearby" vs "More Parks" |

---

### Expected Behavior

| Scenario | Result |
|----------|--------|
| User in Montana | 3 parks with coords show first (sorted by distance), then 692 parks by rating |
| User with filters | Same logic applied to filtered subset |
| Park 582 mi away | Pushed to "More Parks" section at bottom |
| Parks without coords | Appear after all distance-sorted parks, sorted by rating |

---

### Alternative: City/State Matching

If you also want parks **without coordinates** to be prioritized when they match your city/state, I can add reverse geocoding to detect your city and boost matching parks. This would require an additional API call but would make the "fallback tier" smarter.

