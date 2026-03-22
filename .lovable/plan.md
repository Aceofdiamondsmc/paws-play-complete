

## Fix: Restore Map Preview + Replace Price with Address in Service List

### Problems
1. **Map not rendering on WebApp** — The Mapbox map fails silently (likely token fetch error or auth issue). Need a robust fallback: use a **Mapbox Static Images API** as an `<img>` tag while the interactive map loads. If the interactive map fails entirely, the static image still shows a location preview.
2. **Price (`$`) still showing in Explore service list cards** (line 323 in `Explore.tsx`) — needs to be replaced with `verified_address` or removed.
3. **Price in ServicesMap popup** (line ~213 in `ServicesMap.tsx`) — same replacement.

### Changes

**1. `src/components/explore/ServiceLocationMap.tsx`** — Add static map image fallback
- Add a Mapbox Static Images API URL as a background/fallback `<img>` rendered behind the interactive map container. URL format: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+228B22(${lng},${lat})/${lng},${lat},15,0/400x200@2x?access_token=${token}`
- The static image loads instantly and shows the location even if the GL JS map fails.
- Keep the interactive map on top — if it loads, it covers the static image. If it doesn't, the user still sees a map preview.
- Keep the paw marker, Directions button (bottom-right), and address fallback text below.

**2. `src/pages/Explore.tsx` (line 323)** — Replace price with address
- Replace `service.price` with `service.verified_address` shown with a MapPin icon. If no address, hide the line.

**3. `src/components/explore/ServicesMap.tsx` (line ~213)** — Replace price in popup
- Replace `service.price` display with `service.verified_address`. If no address, omit the line.

### Technical Detail
- Static map image uses the same token fetched from the edge function — no additional API calls needed.
- The static image URL is constructed once `mapToken` is available, providing an immediate visual while GL JS initializes.

