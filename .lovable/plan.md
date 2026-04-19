
## What's wrong
The Martinique park IS in the parks table (Id 263) with lat/lng — but the **longitude has the wrong sign**:
- Stored: `lat 14.6109, lng 61.0843` → middle of Indian Ocean
- Correct: `lat 14.6109, lng -61.0843` → Martinique, Caribbean

That's why the marker doesn't appear on the map near you — it's plotted halfway across the world.

Secondary nit: `country` was saved as "Martinique" and `state` as "martinique". Functionally it still loads, but for consistency country should be "France" and state "Martinique".

## Fix (one-step DB update)

Run a single UPDATE on parks.Id = 263:

```sql
UPDATE public.parks
SET longitude = -61.0843,
    country   = 'France',
    state     = 'Martinique',
    city      = 'Fort-de-France'
WHERE "Id" = 263;
```

That's it. After this:
- The park renders at the correct Caribbean location.
- "Go" navigation passes "Parc Naturel Régional de la Martinique Fort-de-France Martinique France" to Apple/Google Maps and resolves correctly.
- The location label shows "Fort-de-France, Martinique, France".

## Why this happened (so we prevent it next time)
The admin "Add Park" form likely accepted a manually-typed longitude without enforcing sign for Western Hemisphere countries. Not fixing that here (you said no rebuild needed for this) — just flagging that for any France-overseas / Americas park, longitude must be negative.

No edge function re-run needed — geocoder is irrelevant since lat/lng already exist (just wrong). No client code changes.

## After approval
Refresh Parks tab → the Martinique park appears in the Caribbean on the map, and shows "Fort-de-France, Martinique, France" in the list/preview.
