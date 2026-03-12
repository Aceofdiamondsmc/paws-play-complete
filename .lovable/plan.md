

## Dynamic Match Badges for Pack Discovery

### Problem
Lines 477-491 in `Pack.tsx` hardcode three badges — "High Energy Match", "Perfect Playmate", "Social Butterfly" — for every dog regardless of actual compatibility with the user's dogs.

### Solution
Replace the hardcoded badges with a `computeMatchBadges` function that compares the discovery dog against the current user's dogs and returns only earned badges.

### Match Logic

| Badge | Icon | Condition | Highlight Color |
|-------|------|-----------|----------------|
| **Energy Match** | Zap | Discovery dog's `energy_level` matches any of your dogs' energy levels | Orange `#f97316` |
| **Size Match** | Ruler | Same `size` as any of your dogs | Blue `#3b82f6` |
| **Play Pal** | Heart | Shares ≥1 `play_style` with any of your dogs | Pink `#ec4899` |
| **Nearby** | MapPin | Distance < 8 km (~5 miles) | Green `#4ade80` |
| **Social Butterfly** | Star | Has 3+ play styles set | Purple `#a855f7` |
| **Vaccinated** | Shield | `vaccination_certified === true` | Already shown above, skip here |

Only badges that are earned get displayed. If none match, show nothing (no empty section).

### Changes — `src/pages/Pack.tsx` only

1. **Add `computeMatchBadges` function** (~30 lines) that takes `currentDog` and `userDogs` array, returns an array of `{ label, icon, color, bgColor, borderColor }` objects based on the conditions above.

2. **Replace lines 477-491** (the hardcoded badges div) with a map over the computed badges array. If no badges, hide the section entirely.

The function uses `userDogs` (already available from `useAuth()` on line 131) so no new data fetching is needed.

