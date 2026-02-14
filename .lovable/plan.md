

## Auto-Locate on Load + Category Placeholders for Explore Tab

### Overview

Three changes: (1) automatically trigger geolocation when the Explore page loads, (2) update fallback images to use placedog.net URLs by category, and (3) visually indicate "Near Me" mode is active from the start.

---

### File Changes

**1. `src/pages/Explore.tsx` -- Auto-locate on page load**

- Change initial state: `nearMeMode` starts as `true`, `isLocating` starts as `true`
- Add a `useEffect` that runs once on mount to request geolocation automatically
- On success: set `userCoords` and keep `nearMeMode = true`
- On failure: set `nearMeMode = false`, show toast, fall back to regular services list
- The existing `handleFindNearMe` toggle still works for manual on/off
- The MapPin button renders as "active" (variant="default") immediately since `nearMeMode` starts true

**2. `src/hooks/useServices.tsx` -- Update fallback images**

- Replace the `FALLBACK_IMAGES` map with placedog.net URLs:
  - `'Groomers'` -> `'https://placedog.net/600/400?id=groom'`
  - `'Trainers'` -> `'https://placedog.net/600/400?id=train'`
  - `'Dog Walkers'` -> `'https://placedog.net/600/400?id=walk'`
  - `'Daycare'` -> `'https://placedog.net/600/400?id=service'`
  - `'Vet Clinics'` -> `'https://placedog.net/600/400?id=service'`
- Update the final fallback in `getServiceImage` to `'https://placedog.net/600/400?id=service'`

---

### Technical Details

**Auto-locate useEffect (in Explore.tsx):**
```typescript
const [nearMeMode, setNearMeMode] = useState(true);
const [isLocating, setIsLocating] = useState(true);

useEffect(() => {
  if (!navigator.geolocation) {
    setNearMeMode(false);
    setIsLocating(false);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setIsLocating(false);
      toast.success("Showing services near you!");
    },
    () => {
      setNearMeMode(false);
      setIsLocating(false);
      toast.error("Could not get your location. Showing all services.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}, []);
```

**Updated FALLBACK_IMAGES (in useServices.tsx):**
```typescript
const FALLBACK_IMAGES: Record<string, string> = {
  'Dog Walkers': 'https://placedog.net/600/400?id=walk',
  'Daycare': 'https://placedog.net/600/400?id=service',
  'Vet Clinics': 'https://placedog.net/600/400?id=service',
  'Trainers': 'https://placedog.net/600/400?id=train',
  'Groomers': 'https://placedog.net/600/400?id=groom',
};
```

---

### Expected Behavior

| State | What Happens |
|-------|-------------|
| Page loads | MapPin button shows active (filled), spinner appears, geolocation requested automatically |
| Location acquired | Services list updates to show nearest services with distance badges |
| Location denied | Falls back to showing all services, MapPin button deactivates, toast shown |
| Manual toggle | Clicking MapPin still toggles near-me mode on/off as before |
| Missing service image | Shows placedog.net placeholder matching the service category |
