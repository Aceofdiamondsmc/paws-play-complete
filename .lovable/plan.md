

## Parks Tab Mobile Performance Optimization

This plan optimizes the Parks tab for mobile performance by implementing pagination with infinite scroll, request cancellation when switching tabs, and a non-blocking loading experience.

---

### What You'll Get

1. **Paginated List with Infinite Scroll** - Only renders 20 parks at a time, loads more as you scroll down
2. **Request Cancellation** - Switching to another tab immediately cancels any pending database fetch
3. **Non-Blocking Loading** - Shows a subtle inline spinner while fetching, keeping the bottom nav fully interactive

---

### Implementation Steps

**1. Update useParks Hook with Pagination and AbortController**

Add pagination state and cancellation support:

```text
New State:
- page: number (current page, starts at 1)
- hasMore: boolean (whether more pages exist)
- isFetchingMore: boolean (for infinite scroll loading)
- abortControllerRef: useRef<AbortController | null>

New Logic:
- Initial fetch: Get first 20 parks sorted by distance/rating
- loadMore(): Fetch next page and append to existing parks
- Abort signal passed to Supabase query via .abortSignal()
- Cleanup function cancels pending request on unmount
```

**2. Create useParksPaginated Hook** (`src/hooks/useParksPaginated.tsx`)

A new hook specifically for the list view with pagination:

```typescript
const PAGE_SIZE = 20;

export function useParksPaginated() {
  const [parks, setParks] = useState<Park[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('parks')
      .select('*')
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, to)
      .abortSignal(abortControllerRef.current.signal);

    if (error?.name === 'AbortError') return; // Cancelled, do nothing

    setHasMore((data?.length || 0) === PAGE_SIZE);
    setParks(prev => append ? [...prev, ...mappedData] : mappedData);
  }, []);

  // Cleanup on unmount - cancels pending request
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchPage(page + 1, true).finally(() => {
        setPage(p => p + 1);
        setLoadingMore(false);
      });
    }
  };

  return { parks, loading, loadingMore, hasMore, loadMore, refresh };
}
```

**3. Create Infinite Scroll Component** (`src/components/parks/ParksList.tsx`)

A new component using IntersectionObserver for infinite scroll:

```text
Component Structure:
+------------------------------------------+
| Park Card 1                              |
| Park Card 2                              |
| ...                                      |
| Park Card 20                             |
| [Sentinel div - triggers loadMore]       |  <- IntersectionObserver target
| [Inline spinner when loading more]       |
+------------------------------------------+
```

```typescript
export function ParksList({ parks, hasMore, loadingMore, onLoadMore }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' } // Trigger 200px before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div className="space-y-3 pb-4">
      {parks.map(park => <ParkCard key={park.id} park={park} />)}
      
      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      
      {!hasMore && parks.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You've seen all {parks.length} parks!
        </p>
      )}
    </div>
  );
}
```

**4. Extract Park Card Component** (`src/components/parks/ParkCard.tsx`)

Move the card rendering logic to a separate memoized component:

```typescript
export const ParkCard = memo(function ParkCard({ 
  park, 
  userLocation, 
  onNavigate 
}: ParkCardProps) {
  const distance = useMemo(() => {
    if (!userLocation || !park.latitude || !park.longitude) return undefined;
    return calculateDistance(userLocation.lat, userLocation.lng, park.latitude, park.longitude);
  }, [userLocation, park.latitude, park.longitude]);

  return (
    <Card className="p-4 card-playful">
      {/* Existing card content */}
    </Card>
  );
});
```

**5. Update Parks Page with Non-Blocking Loading**

Modify the Parks page layout:

```text
Updated Layout:
+------------------------------------------+
| Header (always visible)                  |
| Filters (always visible)                 |
+------------------------------------------+
| [Map View OR List View]                  |
|                                          |
| Initial Loading State:                   |
| - Skeleton cards (3-4) instead of full   |
|   spinner blocking content               |
| - OR cached data shown immediately       |
|                                          |
+------------------------------------------+
| Bottom Nav (always accessible, z-50)     |  <- Never blocked
+------------------------------------------+
```

The loading state changes:
- Show skeleton cards during initial load (non-blocking)
- Show cached data immediately if available
- Inline loading indicator at bottom for "load more"
- Full spinner only if no cache AND first load

---

### Technical Details

**AbortController Integration:**

```typescript
// In useParksPaginated
const abortControllerRef = useRef<AbortController | null>(null);

const fetchPage = async (pageNum: number) => {
  // Cancel previous request
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  try {
    const { data, error } = await supabase
      .from('parks')
      .select('*')
      .range(from, to)
      .abortSignal(abortControllerRef.current.signal);

    if (error) {
      // Check if it was an abort
      if (error.message?.includes('abort')) return;
      throw error;
    }
    // Process data...
  } catch (e) {
    if (e.name === 'AbortError') return; // Silently ignore
    console.error('Fetch error:', e);
  }
};

// Cleanup on unmount (when user navigates away)
useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
  };
}, []);
```

**IntersectionObserver for Infinite Scroll:**

```typescript
useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel || !hasMore) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !loadingMore) {
        onLoadMore();
      }
    },
    { 
      rootMargin: '200px', // Load 200px before reaching bottom
      threshold: 0.1 
    }
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
}, [hasMore, loadingMore, onLoadMore]);
```

**Skeleton Loading State:**

```typescript
// Non-blocking skeleton while fetching first page
{loading && parks.length === 0 && (
  <div className="space-y-3 p-4">
    {[1, 2, 3].map(i => (
      <Card key={i} className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-24 h-24 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </Card>
    ))}
  </div>
)}
```

**Cache + Network Strategy:**

```typescript
useEffect(() => {
  // 1. Show cached data immediately (non-blocking)
  const cached = loadFromCache();
  if (cached.length > 0) {
    setParks(cached.slice(0, PAGE_SIZE));
    setLoading(false);
  }

  // 2. Fetch fresh data in background
  fetchPage(1).finally(() => setLoading(false));

  // 3. Cancel on unmount
  return () => abortControllerRef.current?.abort();
}, []);
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useParksPaginated.tsx` | Create | New paginated hook with AbortController |
| `src/components/parks/ParkCard.tsx` | Create | Memoized card component |
| `src/components/parks/ParksList.tsx` | Create | Infinite scroll list with IntersectionObserver |
| `src/pages/Parks.tsx` | Modify | Use new hooks/components, add skeleton loading |
| `src/hooks/useParks.tsx` | Modify | Add AbortController for map view |

---

### Performance Benefits

| Before | After |
|--------|-------|
| Renders 715 cards at once | Renders only 20 cards initially |
| Full-page blocking spinner | Skeleton cards, non-blocking |
| No request cancellation | AbortController cancels on nav |
| Bottom nav blocked during load | Bottom nav always accessible |
| ~2-3s render time on mobile | ~200ms initial render |

---

### UI Design Notes

The implementation maintains the existing design:
- Same `Card` styling with `card-playful` class
- Same filter pills and badges
- Consistent with other tabs in the app
- Smooth infinite scroll experience
- Loading indicators use `text-primary` color
- Skeleton uses existing `Skeleton` component from shadcn/ui

