

## Fix "Meet [Dog Name]" Button Navigation

### Problem
The "Meet" button on the Social feed navigates to `/pack?dog={dog_id}` or `/pack?user={author_id}`, but the Pack page **completely ignores these query parameters**. It loads the general discovery stack starting at index 0, which is often the current user's own dog (since `get_nearby_dogs` places it first).

### Fix

**File: `src/pages/Pack.tsx`**

1. **Read query params on mount** using `useSearchParams` from `react-router-dom`:
   - Extract `dog` and `user` params from the URL.

2. **After fetching `discoveryDogs`**, find the target dog in the list:
   - If `?dog=<id>` is present, find the index where `dog.id === id`.
   - Else if `?user=<id>` is present, find the index where `dog.owner_id === id`.
   - If a match is found, set `currentIndex` to that index so the card stack opens on the correct dog.

3. **Clear the params after use** (optional but clean) by calling `setSearchParams({})` to avoid stale state on subsequent visits.

### Technical details

```
// New import
import { useSearchParams } from 'react-router-dom';

// Inside component
const [searchParams, setSearchParams] = useSearchParams();

// After discoveryDogs are set (in the fetch useEffect), add:
const targetDogId = searchParams.get('dog');
const targetUserId = searchParams.get('user');

if (targetDogId) {
  const idx = dogs.findIndex(d => d.id === targetDogId);
  if (idx >= 0) setCurrentIndex(idx);
} else if (targetUserId) {
  const idx = dogs.findIndex(d => d.owner_id === targetUserId);
  if (idx >= 0) setCurrentIndex(idx);
}

// Clear params so re-navigation works cleanly
setSearchParams({}, { replace: true });
```

### What stays the same
- Social feed button logic (already generates correct URLs with real `dog_id`/`author_id`)
- Pack discovery fetching and swipe mechanics
- All other navigation in the app

### Files changed
- `src/pages/Pack.tsx` only
