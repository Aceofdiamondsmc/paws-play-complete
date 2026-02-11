

## 3-Tier Proximity Logic with Location Gate and City/State Matching

### Overview

Block the parks list from rendering until the user's location is acquired. Then sort all 715 parks using a strict 3-tier system that uses city/state matching as a fallback for the 97% of parks missing GPS coordinates.

---

### Tier Logic

```text
Tier 1: Parks with valid GPS coords within 50 miles
        --> Sort strictly by Haversine distance (nearest first)

Tier 2: Parks where park.city or park.state matches user's detected city/state
        (even if park has NaN coordinates)
        --> Sort by rating

Tier 3: Everything else
        --> Hidden behind "Show More" button, sorted by rating
```

### User's City/State Detection

Since we need to know the user's city/state to match against parks without GPS data, we'll use a free reverse geocoding API:

```text
GET https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json
--> Returns { address: { city: "Brooklyn", state: "New York" } }
```

This runs once when `userLocation` is acquired. No API key needed.

---

### File Changes

**1. `src/hooks/useNearbyParks.tsx`** -- Major rewrite of sort logic

- Add `userCity` and `userState` state variables
- Add reverse geocode effect that fires when `userLocation` changes
- Add `dataReady` flag: `true` only when `allParks.length > 0` AND `userLocation !== null`
- When `!dataReady`, return empty parks array (UI shows spinner)
- New `useMemo` sort with 3 tiers:
  - Tier 1: `isLocal` = valid coords AND distance <= 50mi, sorted by distance
  - Tier 2: `isCityMatch` = park.city matches userCity OR park.state matches userState (case-insensitive), sorted by rating
  - Tier 3: everything else, sorted by rating
- Return new field `tier1Count` and `tier2Count` for UI section headers
- `displayLimit` only applies to Tier 3 parks; Tiers 1 and 2 always show fully

**2. `src/pages/Parks.tsx`** -- Gate rendering on location

- When `locationLoading || (loading && !parks.length)`: show full-page "Detecting Location..." spinner with animated paw icon
- When `locationError` and no `userLocation`: show retry button
- Remove the current pattern of showing parks while location loads
- Add section headers: "Nearby" (Tier 1+2) and "More Parks" (Tier 3, behind Show More)

**3. `src/components/parks/ParkListItem.tsx`** -- Image fix + address navigation

- Change fallback image to `https://loremflickr.com/300/200/dog,park/all?lock=${park.id}` (was 200x200)
- Show city/state below park name when `park.distance` is undefined
- Update Navigate button: if `coords` is null but `park.address` exists, open Google Maps with address search instead of coordinates
- Add `openNavigationByAddress` helper to navigation-utils

**4. `src/lib/navigation-utils.ts`** -- Address-based navigation

- Add `openNavigationByAddress(address: string, parkName?: string)` function
- Encodes address and opens Google Maps search URL: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

---

### Technical Details

**Reverse Geocode Effect (in useNearbyParks):**
```typescript
useEffect(() => {
  if (!userLocation) return;
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLocation.lat}&lon=${userLocation.lng}&format=json`)
    .then(r => r.json())
    .then(data => {
      setUserCity(data.address?.city || data.address?.town || '');
      setUserState(data.address?.state || '');
    })
    .catch(() => { /* silent fail - city matching just won't work */ });
}, [userLocation]);
```

**3-Tier Sort (in useNearbyParks useMemo):**
```typescript
const categorized = filtered.map(park => {
  const coords = getValidCoords(park.latitude, park.longitude);
  let distance: number | undefined;
  let tier = 3; // default

  if (coords && userLocation) {
    distance = calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
    if (distance <= MAX_LOCAL_DISTANCE) tier = 1;
  }

  if (tier === 3 && (userCity || userState)) {
    const cityMatch = userCity && park.city?.toLowerCase() === userCity.toLowerCase();
    const stateMatch = userState && park.state?.toLowerCase() === userState.toLowerCase();
    if (cityMatch || stateMatch) tier = 2;
  }

  return { park, distance, tier };
});

categorized.sort((a, b) => {
  if (a.tier !== b.tier) return a.tier - b.tier;
  if (a.tier === 1 && a.distance !== undefined && b.distance !== undefined)
    return a.distance - b.distance;
  return (b.park.rating || 0) - (a.park.rating || 0);
});
```

**Address-Based Navigation (in ParkListItem):**
```typescript
const handleNavigate = () => {
  if (coords) {
    openNavigation(coords.lat, coords.lng, park.name || 'Dog Park');
  } else if (park.address) {
    const fullAddress = [park.address, park.city, park.state].filter(Boolean).join(', ');
    openNavigationByAddress(fullAddress, park.name || 'Dog Park');
  }
};
```

---

### Expected Behavior

| State | What Shows |
|-------|-----------|
| Page load | "Detecting Location..." spinner, no parks |
| Location acquired, reverse geocode done | Tier 1 parks (GPS nearby) at top sorted by distance, then Tier 2 parks (same city/state) sorted by rating |
| Tier 3 | Hidden behind "Show More Parks" button |
| Filter clicked (e.g., Water Station) | Same 3-tier logic on filtered subset |
| Location denied | Retry button, no parks shown |
| Park without coords | Navigate button uses address search |

