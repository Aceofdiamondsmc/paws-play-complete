

## Plan: Add all amenity badges to park list items

Currently `ParkListItem.tsx` only shows "Fenced" and "Water" badges. Add the remaining 5 amenities with colors matching their filter pills from `Parks.tsx`.

### Changes in `src/components/parks/ParkListItem.tsx`

**Add imports**: `Dog`, `Dumbbell`, `Car`, `TreePine` from lucide-react.

**Add badges after the Water badge** (after line 110), each conditionally rendered:

| Amenity | Field | Color | Icon | Label |
|---------|-------|-------|------|-------|
| Small Dog Area | `has_small_dog_area` | pink | Dog | Small Dogs |
| Large Dog Area | `has_large_dog_area` | indigo | Dog | Large Dogs |
| Agility | `has_agility_equipment` | orange | Dumbbell | Agility |
| Parking | `has_parking` | slate | Car | Parking |
| Grass | `has_grass_surface` | green | TreePine | Grass |

All use the same `text-[10px] px-1.5 py-0 h-5` sizing pattern. One file, ~25 lines added.

