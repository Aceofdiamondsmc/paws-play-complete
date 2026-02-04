

## Fix Apple Maps Navigation & Coordinate Validation

This plan fixes two critical issues: Apple Maps showing incorrect locations and parks with invalid coordinates displaying navigate buttons.

---

### Issues Identified

| Problem | Root Cause | Impact |
|---------|------------|--------|
| Apple Maps goes to wrong location | Using outdated `maps://` protocol instead of `https://` | iOS users get navigation errors |
| Navigate button shows for invalid parks | `"NaN"` string coordinates pass truthy check | Users can't navigate to parks with bad data |
| Parks list sorting broken | Invalid coordinates break distance calculation | List order is wrong |

---

### Solution 1: Fix Apple Maps URL

Update `getAppleMapsUrl()` in `navigation-utils.ts`:

```typescript
// BEFORE (broken)
export function getAppleMapsUrl(lat: number, lng: number): string {
  return `maps://maps.apple.com/?daddr=${lat},${lng}`;
}

// AFTER (correct)
export function getAppleMapsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}
```

The `maps://` protocol is deprecated and causes inconsistent behavior. Apple recommends using `https://maps.apple.com/` for web links.

---

### Solution 2: Add Coordinate Validation Helper

Add a reusable validation function to `navigation-utils.ts`:

```typescript
/**
 * Check if a coordinate value is valid (not null, NaN, or out of range)
 */
export function isValidCoordinate(value: unknown): value is number {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

/**
 * Check if a park has valid navigable coordinates
 */
export function hasValidCoords(lat: unknown, lng: unknown): boolean {
  return (
    isValidCoordinate(lat) && 
    isValidCoordinate(lng) &&
    (lat as number) >= -90 && (lat as number) <= 90 &&
    (lng as number) >= -180 && (lng as number) <= 180
  );
}
```

---

### Solution 3: Update ParkCard Navigate Button

Update `ParkCard.tsx` to use proper validation:

```typescript
import { hasValidCoords, openNavigation } from '@/lib/navigation-utils';

// Helper to get validated coordinates
const coords = useMemo(() => {
  if (hasValidCoords(park.latitude, park.longitude)) {
    return { lat: park.latitude as number, lng: park.longitude as number };
  }
  return null;
}, [park.latitude, park.longitude]);

// Only show Navigate button if coordinates are valid
{coords && (
  <Button onClick={() => openNavigation(coords.lat, coords.lng, park.name)}>
    <Navigation className="w-4 h-4 mr-1.5" />
    Navigate
  </Button>
)}
```

---

### Solution 4: Update useParksPaginated Distance Calculation

Update distance calculation to properly validate coordinates:

```typescript
// In mapRowToPark function
if (location && hasValidCoords(row.latitude, row.longitude)) {
  const lat = typeof row.latitude === 'string' ? parseFloat(row.latitude) : row.latitude;
  const lng = typeof row.longitude === 'string' ? parseFloat(row.longitude) : row.longitude;
  park.distance = calculateDistance(location.lat, location.lng, lat, lng);
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/navigation-utils.ts` | Fix Apple Maps URL format, add `isValidCoordinate()` and `hasValidCoords()` helpers |
| `src/components/parks/ParkCard.tsx` | Use `hasValidCoords()` to validate before showing Navigate button |
| `src/hooks/useParksPaginated.tsx` | Use `hasValidCoords()` in distance calculation to handle "NaN" strings |

---

### Technical Notes

**Why `https://` instead of `maps://`?**
- The `maps://` URL scheme is a legacy protocol that may not work on all iOS versions
- Apple's documentation recommends using `https://maps.apple.com/` for web-based links
- The `https://` format works universally across browsers and PWAs

**Why coordinate validation matters?**
- Database has parks with `latitude: "NaN"` and `longitude: "NaN"` as strings
- JavaScript's truthy check passes for non-empty strings like `"NaN"`
- Passing NaN to map URLs causes navigation to random/default locations

**Distance Sorting After Fix:**
- Parks with valid coordinates: sorted by distance (nearest first)
- Parks with invalid coordinates: pushed to bottom, sorted by rating

