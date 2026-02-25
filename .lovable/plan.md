

## Fix Admin Service Updates + Make New Services Appear in Nearby Results

### Problems Found

1. **"permission denied for function get_current_user_role"** -- The `services` table has an UPDATE policy ("Moderators can manage featured services") that calls `get_current_user_role()`. Like `is_admin()` before, this function lacks `EXECUTE` permission for the `authenticated` role.

2. **Newly created services don't appear in "Near Me" results** -- Your "Dog Supplies Outlet" (id=201) has `NULL` latitude and longitude. The `get_nearby_services` RPC requires coordinates to calculate distance, so services without them are invisible in proximity searches. The admin Create/Edit form has no coordinate fields.

3. **Featured badge** -- Already exists in the Explore list (line 277 of Explore.tsx). It renders a "Featured" Badge when `is_featured` is true. No changes needed here.

---

### Plan

#### 1. Database: Grant EXECUTE on `get_current_user_role()` (migration)

```sql
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
```

This resolves the UPDATE permission error immediately.

#### 2. Admin Form: Add Latitude/Longitude fields (`AdminServices.tsx`)

- Add `latitude` and `longitude` (string) to `editForm` state (default empty)
- Populate them from `service.latitude` / `service.longitude` on edit
- Add two side-by-side Input fields labeled "Latitude" and "Longitude" in the modal
- Include parsed `latitude`/`longitude` (as floats, or null if empty) in both `insert` and `update` payloads

This ensures admin-created services have coordinates and appear in proximity results.

#### 3. No changes needed for Featured badge

The Explore page already shows a "Featured" badge pill on services where `is_featured = true`. Once the update permission error is fixed, toggling Featured on will make the badge appear.

---

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | `GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;` |
| `src/pages/admin/AdminServices.tsx` | Add `latitude`/`longitude` to form state, UI inputs, and save payloads |

