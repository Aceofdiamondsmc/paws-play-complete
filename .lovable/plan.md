

## Two Changes: Fix Vaccination Badge on Pack Tab + Add ShieldOff Icon to Unverified

### 1. Database Migration — Add `vaccination_certified` to `get_nearby_dogs` RPC

The `get_nearby_dogs` function currently does not return `vaccination_certified`, so the Pack tab always gets `null`. We need to recreate the function with `d.vaccination_certified boolean` added to both the `RETURNS TABLE` definition and the `SELECT` list.

```sql
CREATE OR REPLACE FUNCTION public.get_nearby_dogs(user_lat double precision, user_lng double precision, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, owner_id uuid, name text, breed text, size text, energy_level text, bio text, avatar_url text, age_years integer, play_style text[], created_at timestamp with time zone, owner_display_name text, owner_avatar_url text, owner_city text, owner_state text, distance_meters double precision, vaccination_certified boolean)
 ...
  SELECT 
    d.id, d.owner_id, d.name, d.breed, d.size, d.energy_level, 
    d.bio, d.avatar_url, d.age_years, d.play_style, d.created_at, 
    p.display_name, p.avatar_url, p.city, p.state,
    ...,
    d.vaccination_certified
  FROM dogs d ...
```

### 2. Frontend — Add `ShieldOff` icon to Unverified badge

**`src/pages/Pack.tsx`** (line 3): Add `ShieldOff` to the lucide import.

**`src/pages/Pack.tsx`** (line 502-504): Add `<ShieldOff className="w-4 h-4" />` inside the Unverified badge span.

### Files Changed

| Location | Change |
|----------|--------|
| SQL migration | Recreate `get_nearby_dogs` with `vaccination_certified` in return type and SELECT |
| `src/pages/Pack.tsx` | Import `ShieldOff`, add icon to Unverified badge |

