

## Plan: Color-coordinate Park list item badges with filter pills

The "Fenced" and "Water" badges on individual park cards (`ParkListItem.tsx`) currently use generic theme colors (`bg-accent`, `bg-secondary`). They should match the amber and blue colors of the corresponding filter pills at the top.

### Changes in `src/components/parks/ParkListItem.tsx`

**Fenced badge** (line 100): Change from `bg-accent text-accent-foreground` to `bg-amber-100 text-amber-700 border-amber-300` — matching the amber "Fully Fenced" pill.

**Water badge** (line 106): Change from `bg-secondary text-secondary-foreground` to `bg-blue-100 text-blue-700 border-blue-300` — matching the blue "Water Station" pill.

One file, two lines changed.

