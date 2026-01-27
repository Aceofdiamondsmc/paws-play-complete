
Goal
- Make the Parks tab work again and keep all navigation (“Navigate” buttons + map popup navigation) while using a working Supabase RPC that supports the requested pagination (page_size=50, page_offset increments) and non-blocking render.

What’s broken right now (confirmed)
- Frontend calls RPC `get_parks_nearby(...)` from `src/hooks/useParks.tsx`, but the database does not have that function.
- The only similar function in the DB is `public.get_nearby_parks(user_lat, user_lng, radius_meters)` and it is currently broken:
  - It references columns that don’t exist in `public.parks` (e.g., `p.id` instead of `"Id"`, `p.user_ratings_total` instead of `user_rating_total`, and expects `geom` to be geometry even though the table has `geom` as text).
  - This means even switching the frontend to `get_nearby_parks` would still fail until the DB function is fixed.

High-level fix
- Implement (via Supabase migration) a correct `public.get_parks_nearby()` RPC with the exact signature the UI needs:
  - user_lat, user_lng, radius_meters (default 10000), page_size (default 50), page_offset (default 0)
  - Returns the fields the UI expects plus `distance_meters`
  - Uses correct column names/types from your existing `parks` table (`"Id"`, `user_rating_total`, `geo` geography and/or lat/lng)
- Update frontend to use that function reliably (and preserve navigation UI).

Step-by-step implementation plan

1) Supabase DB: create a working paginated RPC: `public.get_parks_nearby`
- Add a new migration in `supabase/migrations/` that:
  1. Creates or replaces `public.get_parks_nearby(...)`.
  2. Computes distance using PostGIS from either:
     - `parks.geo` (preferred), OR
     - a computed geography from `parks.longitude/parks.latitude` when geo is null (fallback).
  3. Filters to radius using `ST_DWithin(...)`
  4. Sorts by distance ascending
  5. Applies pagination: `LIMIT page_size OFFSET page_offset`

- Return type: match the frontend mapping and types in `src/types/index.ts` and `useParks.mapParksData`, including:
  - `id` should be the bigint `"Id"` (aliased as `id` in the RPC) so existing `String(row.id)` mapping works.
  - `user_ratings_total` should be returned by aliasing from `parks.user_rating_total` to `user_ratings_total` (plural), so existing UI rendering doesn’t break.

- Example shape (final SQL will follow your table exactly):
  - RETURNS TABLE (
      id bigint,
      name text,
      address text,
      city text,
      state text,
      description text,
      latitude double precision,
      longitude double precision,
      geom text,
      image_url text,
      rating double precision,
      user_ratings_total bigint,
      is_fully_fenced boolean,
      has_water_station boolean,
      has_small_dog_area boolean,
      has_large_dog_area boolean,
      has_agility_equipment boolean,
      has_parking boolean,
      has_grass_surface boolean,
      is_dog_friendly boolean,
      gemini_summary text,
      place_id text,
      added_by text,
      created_at text,
      updated_at text,
      distance_meters double precision
    )

- Security:
  - Keep it `SECURITY DEFINER` + `SET search_path TO 'public'` like your existing functions.
  - Since `parks` is already public-readable (RLS policy `parks_select_public`), this doesn’t expand access beyond what you already allow, but it provides a stable API for distance sorting/pagination.

2) (Optional but recommended) Supabase DB: fix or wrap `public.get_nearby_parks`
- To prevent future confusion and to make `src/lib/spatial-utils.ts` safe again, do one of:
  Option A (preferred): redefine `get_nearby_parks(user_lat, user_lng, radius_meters)` as a thin wrapper calling `get_parks_nearby(user_lat,user_lng,radius_meters, page_size:=1000, page_offset:=0)`.
  Option B: update frontend code to stop using `get_nearby_parks` anywhere and leave it as-is (less ideal since it remains broken in the DB).

3) Frontend: keep navigation logic and make Parks load again
- Update `src/hooks/useParks.tsx`:
  - Keep the non-blocking behavior (it already defers the first fetch via `setTimeout(..., 0)`).
  - Ensure it calls the now-working `get_parks_nearby` RPC with the correct argument names:
    - user_lat, user_lng, radius_meters, page_size, page_offset
  - Make pagination more robust:
    - Change `loadMore` to use a functional state update for `pageOffset` to avoid stale state on rapid taps:
      - compute nextOffset from previous offset
      - then call `fetchParks(nextOffset, true)`
  - Keep existing caching fallback (works well for offline / failure cases).

- Update `src/pages/Parks.tsx`:
  - Ensure the “Navigate” button remains present in list view (currently it is).
  - Ensure list view keeps the “Load More” button and shows only a small bottom spinner while `loadingMore` is true (currently it does, but we’ll verify it remains minimal and does not block the whole screen).
  - Ensure map view still renders immediately; it already renders with `ParksMap parks={parks} loading={loading}` and ParksMap separately requests location for its own map centering.

4) Verification checklist (to confirm it’s truly fixed)
- Database:
  - Run in Supabase SQL Editor (Test):
    - `select * from public.get_parks_nearby(36.1699, -115.1398, 10000, 50, 0);`
    - Confirm it returns rows and includes `distance_meters`.
    - Confirm `id` corresponds to `"Id"` values in `parks`.
  - Verify pagination:
    - Offset 0 and offset 50 return different rows (or fewer if dataset smaller).

- App behavior (Preview):
  - Open /parks:
    - Screen renders immediately (header + tabs show even before data).
    - GPS prompt appears (browser-level), then parks load.
  - Switch to List:
    - “Navigate” button is present per park.
    - “Load More” appends 50 more without wiping previous list.
    - During load more, only bottom button shows spinner, not full-page loader.
  - Switch to Map:
    - Markers appear once parks are loaded.
    - Popups still include navigation links.

5) “Undo last prompts” safety option (if you still want a rollback)
- If you decide you’d rather revert to the last known good state instead of applying the fix, use the History panel to restore the project to the message before the Parks/RPC changes, then we can re-apply only the minimal safe changes on top.

Files involved (what will change when we implement)
- Supabase:
  - New migration SQL in `supabase/migrations/*_get_parks_nearby.sql` (and optionally also fix/wrap `get_nearby_parks` in the same migration)
- Frontend:
  - `src/hooks/useParks.tsx` (adjust RPC call + pagination robustness)
  - `src/lib/spatial-utils.ts` (optional: switch to `get_parks_nearby` or keep wrapper approach)
  - `src/pages/Parks.tsx` (verify/restore navigation and bottom-spinner behavior; minimal changes expected)

Expected outcome
- Parks tab works again.
- Navigation buttons remain intact.
- RPC-based fetching is correct and supports page_size/page_offset pagination.
- “Load more” appends results with a small bottom spinner only.
