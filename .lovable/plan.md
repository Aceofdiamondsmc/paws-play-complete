

## Fix: Map Marker Should Match Physical Address

### Problem
The map marker is positioned using `verified_latitude`/`verified_longitude` coordinates, but these may not precisely match the `verified_address`. When a physical address exists, the marker should be geocoded from that address for accuracy.

### Changes

**`src/components/explore/ServiceLocationMap.tsx`**

- When an `address` prop is provided and `mapToken` is available, use the **Mapbox Geocoding API** to forward-geocode the address into precise coordinates before placing the marker.
- API call: `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
- If geocoding succeeds, use the returned coordinates for:
  - The interactive map center
  - The interactive map marker position
  - The static map fallback image URL (pin + center)
- If geocoding fails (no results or network error), fall back to the original `latitude`/`longitude` props as before.
- The geocoding runs once on mount (alongside token fetch), so it doesn't slow down the experience — the static map image updates once coordinates are resolved.

### Technical Detail
- New state: `resolvedCoords` storing the geocoded lat/lng (defaults to the passed props).
- Geocoding happens in the existing `fetchToken` useEffect, right after getting the token — single network roundtrip before map init.
- Both the static image URL and interactive map use `resolvedCoords` instead of raw props.
- No new dependencies or edge functions needed — uses Mapbox Geocoding API directly with the existing token.

