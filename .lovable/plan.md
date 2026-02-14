

## Hard-Code NV Priority + "Local Favorite" Badge + Indiana Demotion

### The Data Reality

There are **zero Nevada (NV) parks** in the database. The nearest states with parks are Arizona (19), Utah (19), Idaho (20), and Oregon (15). Indiana has 7 parks. 180 parks have a NULL state.

Since there are no NV parks, hard-coding "NV priority" alone won't help. The plan will:
1. Treat **neighboring states** (AZ, UT, CA, ID, OR) as "regional" when the user is in NV
2. Add a visible "Local Favorite" badge for state-matched parks
3. Push Indiana parks to the bottom (Tier 3)

---

### Changes

**1. `src/hooks/useNearbyParks.tsx` -- Add NV fallback + regional matching**

- Add a `NEIGHBORING_STATES` map so when `userState === 'NV'`, parks in AZ, UT, CA, ID, OR are also promoted to Tier 2
- In the Tier 2 matching logic, check if `park.state` is in the user's neighboring states list
- When `userState === 'NV'`, explicitly exclude `IN` parks from Tier 2 (they stay in Tier 3)
- Add an `isLocalFavorite` flag to the Park type extension returned from the hook (parks matching user's state or neighboring states)

**2. `src/components/parks/ParkListItem.tsx` -- "Local Favorite" badge + image fix**

- Accept optional `isLocalFavorite` prop
- When true, render a green "Local Favorite" badge on the card
- Confirm the LoremFlickr fallback is already in place (it is -- line 19)

**3. `src/pages/Parks.tsx` -- Section headers for NV vs Others**

- When `detectedState === 'NV'` (or any state), show a section header "Parks Near Nevada" for Tier 2 parks
- Tier 3 header becomes "More Parks" (behind Show More as it already is)
- Pass `isLocalFavorite` flag to each `ParkListItem`

---

### Technical Details

**Neighboring States Map (in useNearbyParks.tsx):**
```typescript
const REGIONAL_STATES: Record<string, string[]> = {
  'NV': ['AZ', 'UT', 'CA', 'ID', 'OR'],
  'CA': ['NV', 'AZ', 'OR'],
  // Can expand later for other states
};
```

**Updated Tier 2 Logic:**
```typescript
// After tier 1 check...
if (tier === 3 && (userCity || userState)) {
  const cityMatch = userCity && park.city?.toLowerCase() === userCity.toLowerCase();
  const stateMatch = userState && park.state?.toUpperCase() === userState;
  const regionalStates = REGIONAL_STATES[userState] || [];
  const regionalMatch = park.state && regionalStates.includes(park.state.toUpperCase());
  
  if (cityMatch || stateMatch || regionalMatch) tier = 2;
}
```

**ParkListItem Badge:**
```typescript
{isLocalFavorite && (
  <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-500/20 text-green-700 border-green-500/30">
    Local Favorite
  </Badge>
)}
```

**Parks.tsx -- Pass flag to list items:**
```typescript
// Determine which parks are "local favorites" (Tier 1 + Tier 2)
const localParkIds = new Set([
  ...tier1Parks.map(p => p.id),
  ...tier2Parks.map(p => p.id),
]);

// In render:
<ParkListItem park={park} isLocalFavorite={localParkIds.has(park.id)} />
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useNearbyParks.tsx` | Add `REGIONAL_STATES` map, update Tier 2 logic to include neighboring states, return tier info |
| `src/components/parks/ParkListItem.tsx` | Add `isLocalFavorite` prop, render green badge when true |
| `src/pages/Parks.tsx` | Compute `localParkIds` set, pass `isLocalFavorite` to each `ParkListItem`, update section headers |

---

### Expected Results

| Scenario | What Shows |
|----------|-----------|
| User in Las Vegas, NV | Tier 1: Any parks with coords within 50mi. Tier 2: AZ, UT, ID, OR parks with "Local Favorite" badge, sorted by rating. Tier 3: Everything else (including IN) behind "Show More". |
| Debug spinner | Shows "Detected: Las Vegas, NV" |
| Indiana parks | Pushed to Tier 3 (bottom), hidden behind "Show More" |
| Navigate button | Uses "Park Name City State" Google Maps search for parks without coords |
| Images | LoremFlickr fallback already active from previous change |

