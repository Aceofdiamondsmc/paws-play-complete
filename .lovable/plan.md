

## Fix: Restore Map Preview + Dog Paw Marker + Directions Button Placement

### Problem
On the **WebApp**, the map preview in Service Details is showing only a static address fallback (no actual map rendering). The 10-second timeout is firing before the map loads, destroying the map and showing just text. Additionally, the marker uses a generic checkmark icon, and the Directions button position needs to stay in the bottom-right corner.

### Root Cause
The timeout at line 51-59 calls `map.current?.remove()` and sets `timedOut = true`, which triggers the fallback UI (lines 149-168) — completely replacing the map container. Even on WebApp, if token fetch + map init takes >10s combined, the map gets killed.

### Changes

**`src/components/explore/ServiceLocationMap.tsx`** — Three fixes:

1. **Keep map alive on timeout**: Instead of destroying the map when the timeout fires, keep the map container visible and show the address + Directions as a fallback *below* it. If the map eventually loads, hide the fallback. Increase timeout to 20s.

2. **Replace checkmark with dog paw SVG**: Swap the verified checkmark icon inside the green circle marker with a paw print SVG. Non-verified markers keep the white dot.

3. **Directions button stays bottom-right**: In both the map-loaded state and the timeout/fallback state, keep the Directions button positioned `absolute bottom-2 right-2` over the map. The fallback address text appears below the map container rather than replacing it.

### Layout after fix
```text
┌──────────────────────────┐
│                          │
│   [Map with paw marker]  │
│                          │
│              [Directions] │  ← bottom-right
└──────────────────────────┘
  📍 123 Main St, Boston     ← address below map (always visible)
```

If map fails completely (no token), show the existing static fallback with Directions in bottom-right.

