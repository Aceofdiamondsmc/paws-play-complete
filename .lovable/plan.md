

## Fix: Make Exploration Peak Park Visible in List View

### Problem

There are **two** entries for "Exploration Peak Park" in the database:
- **Id 261**: `city: 'Las vegas'`, `state: 'Nv'`, `added_by: null`, no coordinates
- **Id 262**: `city: 'Las Vegas'`, `state: 'NV'`, `added_by: '7ffea141-...'`, no coordinates

Both lack latitude/longitude. Without coordinates, the park can't enter Tier 1 (distance-based). It should fall to Tier 2 via state/city match or `added_by` promotion, but the duplicate is noise and neither has coords for distance display.

### Fix (SQL Migration)

1. **Delete the duplicate** (Id 261, no `added_by`)
2. **Set coordinates** on Id 262 — Exploration Peak Park, Las Vegas is at approximately `36.0116, -115.2458`

This puts the park into **Tier 1** (within 50 miles) for Las Vegas users, with proper distance display.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Delete duplicate Id 261, set lat/lng on Id 262 |

