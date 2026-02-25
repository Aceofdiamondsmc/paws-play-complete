

## Add Verified & Featured Toggles to Admin Service Management

### What's Missing
The Create/Edit Service modal has no way to set `is_verified` or `is_featured` -- both columns exist in the `services` table and are already rendered in the UI (badges on Explore, ServiceDetails, and the admin list), but the admin form simply doesn't include controls for them.

### Changes (Single File)

**`src/pages/admin/AdminServices.tsx`**

1. **Extend the edit form state** to include `is_verified` and `is_featured` (booleans, default `false`).

2. **Populate on edit** -- when `openEditModal` is called, read the existing `is_verified` and `is_featured` values from the service.

3. **Add two Switch toggles** in the Create/Edit modal (below the image section):
   - "Verified Business" toggle (maps to `is_verified`)
   - "Featured Listing" toggle (maps to `is_featured`)

4. **Send the values on save** -- include `is_verified` and `is_featured` in both the `insert` (create) and `update` (edit) payloads.

### No Database Changes Needed
Both `is_verified` and `is_featured` columns already exist on the `services` table. The `is_admin()` RLS policies (now fixed) allow admin inserts/updates. No migration required.

### Technical Detail

```
editForm state addition:
  is_verified: boolean (default false)
  is_featured: boolean (default false)

UI: two Switch components with Labels inside the modal form

Save payloads: add is_verified, is_featured to both insert({...}) and update({...}) calls
```

