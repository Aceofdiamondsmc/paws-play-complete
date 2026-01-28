

## Add "Find Near Me" Button to Explore Page

Add a location-based search feature that captures the user's current position and fetches nearby pet services sorted by distance.

---

### Overview

```text
+------------------------------------------------------------+
|  Explore                              [List] [Map]         |
+------------------------------------------------------------+
|  [ 🔍 Search pet services...        ] [ 📍 Near Me ]       |
+------------------------------------------------------------+
|  [Dog Walkers] [Daycare] [Vet Clinics] [Trainers] ...      |
+------------------------------------------------------------+
|  Nearby Services (12)                                      |
|  +-------------------------------------------------------+ |
|  | [img] Happy Paws Grooming          ★ 4.8              | |
|  |       Groomers    • 0.3 mi away                       | |
|  +-------------------------------------------------------+ |
```

When the "Near Me" button is clicked:
1. Request location permission using `navigator.geolocation`
2. Call a new Supabase RPC function `get_nearby_services`
3. Update the list with results sorted by proximity
4. Display actual distance on each service card

---

### Implementation Steps

#### Step 1: Create Database RPC Function

Create `get_nearby_services` in Supabase to perform spatial proximity queries.

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_nearby_services(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 40000,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  name text,
  category text,
  rating numeric,
  price text,
  description text,
  enriched_description text,
  image_url text,
  is_featured boolean,
  is_verified boolean,
  is_flagged boolean,
  latitude double precision,
  longitude double precision,
  verified_latitude double precision,
  verified_longitude double precision,
  phone text,
  website text,
  photo_reference text,
  enrichment_status text,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_point geography;
BEGIN
  user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.category,
    s.rating,
    s.price,
    s.description,
    s.enriched_description,
    s.image_url,
    s.is_featured,
    s.is_verified,
    s.is_flagged,
    s.latitude,
    s.longitude,
    s.verified_latitude,
    s.verified_longitude,
    s.phone,
    s.website,
    s.photo_reference,
    s.enrichment_status,
    CASE 
      WHEN s.geo IS NOT NULL THEN ST_Distance(s.geo, user_point)
      WHEN COALESCE(s.verified_latitude, s.latitude) IS NOT NULL 
           AND COALESCE(s.verified_longitude, s.longitude) IS NOT NULL THEN 
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            COALESCE(s.verified_longitude, s.longitude), 
            COALESCE(s.verified_latitude, s.latitude)
          ), 4326)::geography,
          user_point
        )
      ELSE NULL
    END AS distance_meters
  FROM services s
  WHERE 
    (filter_category IS NULL OR s.category = filter_category)
    AND (
      (s.geo IS NOT NULL AND ST_DWithin(s.geo, user_point, radius_meters))
      OR 
      (s.geo IS NULL 
       AND COALESCE(s.verified_latitude, s.latitude) IS NOT NULL 
       AND COALESCE(s.verified_longitude, s.longitude) IS NOT NULL 
       AND ST_DWithin(
         ST_SetSRID(ST_MakePoint(
           COALESCE(s.verified_longitude, s.longitude), 
           COALESCE(s.verified_latitude, s.latitude)
         ), 4326)::geography,
         user_point,
         radius_meters
       ))
    )
  ORDER BY 
    s.is_featured DESC,
    distance_meters ASC NULLS LAST;
END;
$$;
```

---

#### Step 2: Update useServices Hook

Add a new hook function to fetch nearby services.

**File:** `src/hooks/useServices.tsx`

**Changes:**
- Add `useNearbyServices` hook that accepts coordinates
- Handle the RPC call to `get_nearby_services`
- Map distance values to a human-readable format

```typescript
export function useNearbyServices(
  coords: { latitude: number; longitude: number } | null,
  category?: string | null
) {
  return useQuery({
    queryKey: ['nearby-services', coords?.latitude, coords?.longitude, category],
    queryFn: async () => {
      if (!coords) return null;
      
      const { data, error } = await (supabase.rpc as any)('get_nearby_services', {
        user_lat: coords.latitude,
        user_lng: coords.longitude,
        radius_meters: 40000, // ~25 miles
        filter_category: category || null
      });

      if (error) throw error;
      
      return (data as any[]).map(row => ({
        ...row,
        distance: formatDistanceForDisplay(row.distance_meters)
      })) as Service[];
    },
    enabled: !!coords,
  });
}
```

---

#### Step 3: Update Explore Page UI

**File:** `src/pages/Explore.tsx`

**Changes:**
1. Add state for user coordinates and "near me" mode
2. Add "Find Near Me" button next to the search bar
3. Toggle between regular services and nearby services based on mode
4. Show loading state while fetching location
5. Display actual calculated distances on service cards

```tsx
// New state
const [userCoords, setUserCoords] = useState<{latitude: number; longitude: number} | null>(null);
const [isLocating, setIsLocating] = useState(false);
const [nearMeMode, setNearMeMode] = useState(false);

// Use nearby services when in nearMeMode
const { data: nearbyServices, isLoading: nearbyLoading } = useNearbyServices(
  nearMeMode ? userCoords : null,
  selectedCategory
);

// Find Near Me button handler
const handleFindNearMe = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation not supported");
    return;
  }
  
  setIsLocating(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setNearMeMode(true);
      setIsLocating(false);
      toast.success("Showing services near you!");
    },
    (error) => {
      setIsLocating(false);
      toast.error("Could not get your location");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};
```

**UI Addition (next to search bar):**
```tsx
<div className="flex gap-2">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
    <Input placeholder="Search pet services..." className="pl-10 rounded-full" />
  </div>
  <Button
    variant={nearMeMode ? "default" : "outline"}
    size="icon"
    className="rounded-full shrink-0"
    onClick={handleFindNearMe}
    disabled={isLocating}
  >
    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
  </Button>
</div>
```

---

### User Experience Flow

1. User taps the **📍 Near Me** button
2. Browser prompts for location permission (if not already granted)
3. Button shows a loading spinner while fetching location
4. Once location is obtained, services list refreshes with:
   - Results sorted by distance (closest first)
   - Distance badge on each card (e.g., "0.3 mi away")
5. The button stays highlighted to indicate "Near Me" mode is active
6. Tapping again clears the filter and returns to default view

---

### Technical Summary

| Component | Change |
|-----------|--------|
| Database | New `get_nearby_services` RPC function using PostGIS |
| `src/hooks/useServices.tsx` | Add `useNearbyServices` hook |
| `src/pages/Explore.tsx` | Add "Near Me" button, location state, toggle logic |
| `src/lib/spatial-utils.ts` | Reuse existing `formatDistance` helper |

---

### Files to Modify

1. **Database migration** - Create `get_nearby_services` RPC
2. **`src/hooks/useServices.tsx`** - Add `useNearbyServices` hook
3. **`src/pages/Explore.tsx`** - Add button, state, and conditional rendering

