

## Food Supply Tracker — Beautiful UX Implementation

No database changes needed. All state derived from existing `care_history` restock logs; preferences in `localStorage`.

### Changes

**1. `src/hooks/useCareHistory.tsx`**
- Add a parallel query for the latest restock entry (`category = 'restock'`, limit 1, ordered by `completed_at desc`)
- Expose `supplyStatus` object:
  ```
  { status: 'stocked' | 'low' | 'out' | 'unknown', daysSince: number | null, lastEntry: CareHistoryEntry | null }
  ```
- Accept `bagSize` param (`'standard' | 'small'`) for threshold calculation:
  - Standard: green 0–14d, yellow 15–25d, red 26+d
  - Small: green 0–7d, yellow 8–12d, red 13+d
- "Out of stock" task_details always → `'out'` regardless of days

**2. `src/components/dates/CareScheduleSection.tsx`**
Add a visually rich, dismissible Food Supply Tracker card between the header and notification section:

- **localStorage state**: `foodSupplyTrackerEnabled` (default `true`), `foodSupplyBagSize` (`'standard' | 'small'`, default `'standard'`)

- **Supply Status Card** (when enabled):
  - Rounded card with a subtle gradient background matching status color
  - Green: `bg-gradient-to-r from-emerald-500/10 to-green-500/5` with emerald border glow
  - Yellow: `bg-gradient-to-r from-amber-500/10 to-yellow-500/5` with amber border
  - Red: `bg-gradient-to-r from-red-500/10 to-rose-500/5` with red border + subtle pulse animation
  - Large status icon (ShoppingBag) with colored circular background
  - Bold status text: "Stocked", "Running Low", "Time to Restock!", "Out of Stock!"
  - Subtitle: "Restocked X days ago" or "Last: Brand & Size" from task_details
  - Animated progress bar showing supply depletion (full→empty based on days/threshold)
  - Bag size toggle: two small pill-shaped chips ("Standard" / "Small Bag") styled with the app's ToggleGroup
  - Dismiss "X" button (top-right corner, ghost style)

- **Red status enhancements**:
  - Uses `animate-pulse-urgent` (existing CSS utility) on the card border
  - ShoppingBag icon pulses
  - "Restock Now" prompt text

- **Re-enable button** (when tracker is hidden):
  - Subtle outlined button with ShoppingBag icon in the Quick Log section area
  - "Enable Food Supply Tracker" label

### Visual Design Details

The card uses the app's warm coral/orange primary palette for consistency. Status colors complement the existing design system variables (`--success`, `--warning`, `--destructive`). The progress bar uses a smooth CSS transition with rounded ends. Bag size chips use the existing `ToggleGroup` component with `rounded-full` styling matching the rest of Care Schedule.

```text
┌─────────────────────────────────────────┐
│  [X]                                    │
│  🛒  ████████████░░░░  Running Low     │
│       Restocked 18 days ago             │
│       Last: 30lb Purina Pro Plan        │
│                                         │
│  [ Standard ]  [ Small Bag ]            │
└─────────────────────────────────────────┘
```

### No Database Migration Required
All data from existing `care_history` with `category = 'restock'`. Preferences client-side only in localStorage — fully reversible.

