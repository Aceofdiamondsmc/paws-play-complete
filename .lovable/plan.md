

## Enable Tinder-Style Dog Discovery on Pack Tab

This plan transforms the Pack tab into a full discovery experience where users can swipe through all dogs on the platform, sorted by proximity when location data is available.

---

### Summary of Changes

| Step | Description |
|------|-------------|
| 1 | Create a public dogs view (`dogs_discovery`) for authenticated users to browse all dogs except their own |
| 2 | Add optional location columns to profiles table for proximity-based sorting |
| 3 | Create an RPC function to fetch dogs sorted by distance from user's current location |
| 4 | Update Pack.tsx to use geolocation and fetch dogs sorted by proximity |

---

### Architecture Overview

```text
+------------------+     +----------------------+     +-------------------+
|  User Location   | --> |  Supabase RPC        | --> |  Dogs sorted by   |
|  (Geolocation)   |     |  get_nearby_dogs()   |     |  distance         |
+------------------+     +----------------------+     +-------------------+
                                   |
                                   v
                         +-------------------+
                         |  dogs_discovery   |
                         |  (public view)    |
                         +-------------------+
```

---

### Step 1: Create Dogs Discovery View

Create a database view that exposes dogs to authenticated users while excluding the current user's own dogs (they don't need to discover themselves).

```sql
-- Create a public view for dog discovery
CREATE VIEW public.dogs_discovery
WITH (security_invoker = on) AS
SELECT 
  d.id,
  d.owner_id,
  d.name,
  d.breed,
  d.size,
  d.energy_level,
  d.bio,
  d.avatar_url,
  d.age_years,
  d.play_style,
  d.created_at,
  p.display_name as owner_display_name,
  p.avatar_url as owner_avatar_url,
  p.city as owner_city,
  p.state as owner_state,
  p.latitude as owner_latitude,
  p.longitude as owner_longitude
FROM dogs d
LEFT JOIN profiles p ON d.owner_id = p.id
WHERE d.owner_id != auth.uid();
```

Add RLS policy to allow authenticated users to SELECT from dogs:

```sql
-- Allow authenticated users to read all dogs for discovery
CREATE POLICY "dogs_read_for_discovery"
ON public.dogs FOR SELECT
TO authenticated
USING (true);
```

---

### Step 2: Add Location to Profiles

Add optional latitude/longitude columns to profiles so we can sort dogs by their owner's location.

```sql
-- Add location columns to profiles for proximity matching
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add index for spatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

---

### Step 3: Create Nearby Dogs RPC Function

Create a database function that returns dogs sorted by distance from the user's current location.

```sql
CREATE OR REPLACE FUNCTION get_nearby_dogs(
  user_lat double precision,
  user_lng double precision,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  breed text,
  size text,
  energy_level text,
  bio text,
  avatar_url text,
  age_years integer,
  play_style text[],
  created_at timestamptz,
  owner_display_name text,
  owner_avatar_url text,
  owner_city text,
  owner_state text,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.owner_id,
    d.name,
    d.breed,
    d.size,
    d.energy_level,
    d.bio,
    d.avatar_url,
    d.age_years,
    d.play_style,
    d.created_at,
    p.display_name,
    p.avatar_url,
    p.city,
    p.state,
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        ST_DistanceSphere(
          ST_MakePoint(user_lng, user_lat),
          ST_MakePoint(p.longitude, p.latitude)
        )
      ELSE NULL
    END as distance_meters
  FROM dogs d
  LEFT JOIN profiles p ON d.owner_id = p.id
  WHERE d.owner_id != auth.uid()
  ORDER BY 
    CASE 
      WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        ST_DistanceSphere(
          ST_MakePoint(user_lng, user_lat),
          ST_MakePoint(p.longitude, p.latitude)
        )
      ELSE 999999999 -- Put dogs without location at the end
    END ASC
  LIMIT limit_count;
END;
$$;
```

---

### Step 4: Update Pack.tsx

Modify the Pack page to:
1. Request user's current location via Geolocation API
2. Call the `get_nearby_dogs` RPC with the user's coordinates
3. Fall back to fetching all dogs without sorting if location is unavailable
4. Display distance badge on each dog card

**Key code changes:**

```typescript
// Get user location on mount
const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        // Location denied - will fetch without distance sorting
        setUserLocation(null);
      }
    );
  }
}, []);

// Fetch dogs based on location availability
const fetchDogs = async () => {
  setLoading(true);
  
  if (userLocation) {
    // Use RPC for proximity-sorted results
    const { data: dogs } = await supabase.rpc('get_nearby_dogs', {
      user_lat: userLocation.lat,
      user_lng: userLocation.lng,
      limit_count: 50
    });
    // Process dogs...
  } else {
    // Fallback: fetch all dogs without distance sorting
    const { data: dogs } = await supabase
      .from('dogs_discovery')
      .select('*')
      .limit(50);
    // Process dogs...
  }
};
```

---

### Step 5: Add Distance Display

Show the distance on each dog card when available:

```tsx
{currentDog.distance_meters && (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm">
    <MapPin className="w-3 h-3" />
    {formatDistanceMiles(currentDog.distance_meters)}
  </span>
)}
```

---

### Optional: Prompt User to Save Location

Add a prompt on the Me/Profile page to optionally save their location for better discovery matching:

```tsx
<Button onClick={async () => {
  const location = await getCurrentLocation();
  if (location) {
    await supabase
      .from('profiles')
      .update({ 
        latitude: location.latitude, 
        longitude: location.longitude 
      })
      .eq('id', user.id);
  }
}}>
  Save My Location for Discovery
</Button>
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add location columns to profiles, create dogs_discovery view, create RPC function, add RLS policy |
| `src/pages/Pack.tsx` | Modify | Add geolocation, use RPC for proximity sorting, display distance |
| `src/types/index.ts` | Modify | Add DogWithDistance interface |

---

### Security Considerations

- The `dogs_discovery` view uses `security_invoker = on` to respect RLS
- The RPC function uses `SECURITY DEFINER` but explicitly excludes the current user's dogs
- Only authenticated users can access the discovery features
- User location is optional and stored with consent

---

### Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| User denies location access | Shows all dogs in database order |
| Dog owner has no saved location | Dog appears at end of sorted list |
| No dogs in database | Shows test dogs (existing fallback) |
| User not authenticated | Pack tab won't load dogs (RLS protection) |

