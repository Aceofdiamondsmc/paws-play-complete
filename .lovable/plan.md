

## Update Parks Tab to Use `get_parks_nearby` RPC with Pagination

This plan updates the Parks tab to use the new `get_parks_nearby` Supabase RPC function with pagination support, non-blocking rendering, and a "Load More" button.

---

### Summary of Changes

| Step | Description |
|------|-------------|
| 1 | Update `useParks` hook to accept user location and use the new RPC |
| 2 | Add pagination state (`pageOffset`) and `loadMore` function |
| 3 | Update Parks.tsx to request GPS location on mount |
| 4 | Add "Load More" button at the bottom of the list view |
| 5 | Show a small spinner only during pagination loads |
| 6 | Ensure initial render is non-blocking (show UI immediately) |

---

### Implementation Details

#### 1. Update `useParks` Hook (`src/hooks/useParks.tsx`)

Refactor the hook to:
- Accept optional `userLat` and `userLng` parameters
- Call `get_parks_nearby` RPC instead of a standard `select`
- Add `pageOffset` state and `loadMore` function
- Append results on pagination (not replace)
- Track `hasMore` to know when to hide the button

```typescript
interface UseParksOptions {
  userLat?: number;
  userLng?: number;
  radiusMeters?: number;
  pageSize?: number;
}

export function useParks(options: UseParksOptions = {}) {
  const { userLat, userLng, radiusMeters = 10000, pageSize = 50 } = options;
  
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);

  const fetchParks = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!userLat || !userLng) {
      // No location - fall back to cache or show empty
      return;
    }

    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data, error: rpcError } = await (supabase.rpc as any)('get_parks_nearby', {
        user_lat: userLat,
        user_lng: userLng,
        radius_meters: radiusMeters,
        page_size: pageSize,
        page_offset: offset
      });

      if (rpcError) throw rpcError;

      const newParks = mapParksData(data || []);

      if (append) {
        setParks(prev => [...prev, ...newParks]);
      } else {
        setParks(newParks);
      }

      setHasMore(newParks.length === pageSize);

    } catch (e) {
      console.error('Error fetching parks:', e);
      setError('Failed to load parks');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userLat, userLng, radiusMeters, pageSize]);

  const loadMore = useCallback(() => {
    const newOffset = pageOffset + pageSize;
    setPageOffset(newOffset);
    fetchParks(newOffset, true);
  }, [pageOffset, pageSize, fetchParks]);

  // Fetch when location changes
  useEffect(() => {
    if (userLat && userLng) {
      setPageOffset(0);
      fetchParks(0, false);
    }
  }, [userLat, userLng, fetchParks]);

  return {
    parks: filteredParks,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    // ... rest of existing returns
  };
}
```

#### 2. Update Parks Page (`src/pages/Parks.tsx`)

Request GPS location on mount and pass to hook:

```typescript
export default function Parks() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Request GPS location on mount
  useEffect(() => {
    getCurrentLocation().then(location => {
      if (location) {
        setUserLocation({ lat: location.latitude, lng: location.longitude });
      }
    });
  }, []);

  // Pass location to useParks hook
  const { 
    parks, 
    loading, 
    loadingMore,
    hasMore,
    loadMore,
    activeFilters, 
    toggleFilter 
  } = useParks({
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
    radiusMeters: 10000,
    pageSize: 50
  });

  // ... rest of component
}
```

#### 3. Add "Load More" Button to List View

Add at the bottom of the list view, only showing when there are more results:

```tsx
{/* List View Content */}
<div className="flex-1 overflow-y-auto p-4 space-y-3">
  {loading ? (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ) : parks.length === 0 ? (
    <div className="text-center py-12 text-muted-foreground">
      <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="font-medium">No parks found nearby</p>
      <p className="text-sm mt-1">Try expanding your search area</p>
    </div>
  ) : (
    <>
      {parks.map(park => (
        <Card key={park.id}>
          {/* ... existing park card content ... */}
        </Card>
      ))}
      
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Parks'
            )}
          </Button>
        </div>
      )}
    </>
  )}
</div>
```

---

### Data Flow

```text
+------------------+     +-------------------+     +------------------+
|  Parks.tsx       |     |  useParks Hook    |     |  Supabase RPC    |
|  Mount           | --> |  userLat/Lng set  | --> |  get_parks_nearby|
+------------------+     +-------------------+     +------------------+
        |                         |                        |
        v                         v                        v
+------------------+     +-------------------+     +------------------+
|  getCurrentLoc() |     |  fetchParks(0)    |     |  Returns 50 parks|
|  GPS request     |     |  offset=0         |     |  sorted by dist  |
+------------------+     +-------------------+     +------------------+
                                  |
                                  v
                         +-------------------+
                         |  User taps        |
                         |  "Load More"      |
                         +-------------------+
                                  |
                                  v
                         +-------------------+     +------------------+
                         |  loadMore()       | --> |  RPC offset=50   |
                         |  fetchParks(50)   |     |  Append results  |
                         +-------------------+     +------------------+
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useParks.tsx` | Refactor to use RPC with pagination, add `loadMore` function |
| `src/pages/Parks.tsx` | Pass location to hook, add "Load More" button and spinner |

---

### Technical Notes

- **Non-blocking Render**: The UI renders immediately with `loading=true` state. No blocking occurs.
- **Cache Strategy**: Cache can still be used for offline fallback, but primary data comes from the RPC.
- **Distance Field**: The RPC should return `distance_meters` which maps to `park.distance` for display.
- **Pagination Reset**: When location changes, `pageOffset` resets to 0 and parks are replaced (not appended).
- **hasMore Logic**: If fewer than `pageSize` results return, we know there are no more pages.
- **Filter Integration**: Client-side filtering continues to work on the fetched results.

