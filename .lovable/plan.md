

## Plan: Unify Filter Pills Across Parks and Services Tabs

### What changes

**1. Parks filter pills → colorful individual colors with glow (matching Services)**

Each Parks filter gets its own color identity, replacing the plain `bg-primary`/`bg-card` styling:

| Filter | Inactive | Active (with glow) |
|--------|----------|---------------------|
| Fully Fenced | `bg-amber-100 text-amber-600` | `bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]` |
| Water Station | `bg-blue-100 text-blue-600` | `bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]` |
| Small Dog Area | `bg-pink-100 text-pink-600` | `bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]` |
| Large Dog Area | `bg-indigo-100 text-indigo-600` | `bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]` |
| Agility Equipment | `bg-orange-100 text-orange-600` | `bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]` |
| Parking | `bg-slate-100 text-slate-600` | `bg-slate-500 text-white shadow-[0_0_20px_rgba(100,116,139,0.5)]` |
| Grass Surface | `bg-green-100 text-green-600` | `bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]` |

The `filterOptions` array gets `color` and `activeColor` fields (same pattern as `serviceCategories` in Explore.tsx). The button classes switch from `cn(...)` with border logic to the simpler template literal pattern used in Services.

**2. Services card category badges → match their pill color**

Currently the category badge on each service card is a plain `<Badge variant="secondary">`. Update `ServiceCard` in `Explore.tsx` to use a color map that matches the category pill colors:

- Dog Walkers → `bg-blue-100 text-blue-600 border-blue-200`
- Daycare → `bg-green-100 text-green-600 border-green-200`
- Vet Clinics → `bg-red-100 text-red-600 border-red-200`
- Trainers → `bg-orange-100 text-orange-600 border-orange-200`
- Groomers → `bg-purple-100 text-purple-600 border-purple-200`

This creates visual continuity — the pill color at the top matches the badge color on each card below.

### Files

| File | Change |
|------|--------|
| `src/pages/Parks.tsx` | Add `color`/`activeColor` to filter options, update pill button classes, remove `FilterOption` type import |
| `src/pages/Explore.tsx` | Add category color map, update `ServiceCard` badge to use matching colors |

