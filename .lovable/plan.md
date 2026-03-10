

## Plan: Food Supply Tracker Tweaks

Three targeted changes, no new files.

### 1. Swap "Full" and "Empty" labels

The progress bar fills from left (empty) to right (full), but labels are reversed. Swap them so "Empty" is on the left and "Full" is on the right — matching the bar direction. Applies in both the `unknown` state and the normal state sections.

### 2. Add "Large" bag size option — shift all thresholds

Update the `BagSize` type and threshold logic:

| Size | Supply Duration | Yellow (low) | Red (out) |
|------|----------------|-------------|-----------|
| **Large** (new) | ~30 day | 15 days | 26 days |
| **Standard** (was standard) | ~15 day | 8 days | 13 days |
| **Small Bag** (new logic) | ~7 day | 4 days | 6 days |

**Files affected:**
- `src/hooks/useCareHistory.tsx` — Update `BagSize` type to `'large' | 'standard' | 'small'`, update `computeSupplyStatus` thresholds, update `maxDays` mapping
- `src/components/dates/FoodSupplyTracker.tsx` — Add "Large" toggle option, update badge text (`~30 day`, `~15 day`, `~7 day`), update `maxDays` mapping

### 3. Make the supply duration badge pop

Add a subtle yellow/amber glow + slightly bolder styling to the badge showing `~30 day supply` / `~15 day supply` / `~7 day supply`. Use a `shadow-[0_0_6px_rgba(234,179,8,0.4)]` and a light amber background regardless of status, so it always stands out.

### Files

| File | Change |
|------|--------|
| `src/hooks/useCareHistory.tsx` | Update `BagSize` type, add `large` thresholds, shift existing thresholds down |
| `src/components/dates/FoodSupplyTracker.tsx` | Swap Full/Empty, add Large toggle, update badge text + glow styling |

