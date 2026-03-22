

## Plan: Fix Service Details — Map, Directions & Address Display

### Problem Summary
1. **Map stuck loading on TestFlight** — Mapbox GL JS can fail silently in Capacitor WebViews. The map needs a fallback with a timeout so users aren't stuck on a spinner.
2. **Directions go to wrong spot** — Currently uses raw lat/lng coordinates. Should use the `verified_address` (physical address) for precise navigation.
3. **No address displayed** — Users can't see where the service is located. Replace the Price card with an Address card showing the `verified_address`.

### Changes

**1. `src/hooks/useServices.tsx`** — Add `verified_address` to the Service interface
- Add `verified_address: string | null` to the `Service` interface (the column already exists in the DB).

**2. `src/components/explore/ServiceLocationMap.tsx`** — Fix map rendering + directions
- Add a 10-second timeout: if the map doesn't fire the `load` event, show a static fallback (address text + Directions button) instead of an infinite spinner.
- Pass `address` as a new prop alongside coordinates.
- Update `handleGetDirections` to use the smart navigation utility (`openNavigation` from `navigation-utils.ts`) which offers Apple Maps vs Google Maps on iOS. When an address is available, use address-based navigation (`openNavigationByAddress`) for precision; fall back to coordinate-based navigation otherwise.

**3. `src/pages/ServiceDetails.tsx`** — Replace Price card with Address card, pass address to map
- Remove the Price/DollarSign quick-info card.
- Replace it with an Address card showing `service.verified_address` (with a MapPin icon). If no address exists, show the distance card in its place.
- Pass the `address` prop to `ServiceLocationMap`.
- The directions button in the map component will now navigate to the physical address, ensuring cohesive routing.

### Technical Details
- `ServiceLocationMap` new prop: `address?: string`
- Timeout fallback renders the address text and a Directions button (no Mapbox dependency), solving the Capacitor WebView rendering issue
- Navigation uses `openNavigation()` for iOS Apple Maps/Google Maps chooser, and `openNavigationByAddress()` when only an address string is available
- Both WebApp and native app benefit: WebApp gets address display, native app gets reliable fallback when Mapbox fails

