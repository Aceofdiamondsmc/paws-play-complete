

## Add Website URL and Phone Fields to Admin Service Form

### What's Missing
The `services` table already has `website` and `phone` columns (used in ServiceDetails.tsx for Contact/Website buttons), but the admin Create/Edit modal has no fields for them. This means admins can't set a website URL or phone number when creating or editing services.

### Changes (Single File: `src/pages/admin/AdminServices.tsx`)

1. **Extend `editForm` state** -- add `website: ''` and `phone: ''` to the initial state object (line 59) and the `openCreateModal` reset (line 108).

2. **Populate on edit** -- in `openEditModal`, read `service.website` and `service.phone` into the form state.

3. **Add two Input fields** in the modal form (after the Address/Geocode section, before the Image section):
   - "Website URL" -- text input with `https://` placeholder
   - "Phone" -- text input with phone number placeholder

4. **Include in save payloads** -- add `website` and `phone` (trimmed, or null if empty) to both the `insert` and `update` Supabase calls.

### No Database Changes Needed
Both `website` and `phone` columns already exist on the `services` table. The ServiceDetails page already renders Contact and Website buttons using these fields.

