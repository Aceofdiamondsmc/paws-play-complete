
## Fix: Rating and Price Not Saving on Edit

### Problem
When editing an existing service, the `rating` and `price` fields are missing from the Supabase `update` payload (lines 156-168 in `AdminServices.tsx`). They are only included in the `insert` payload for new services. This means any changes to rating or price are silently discarded on save.

### Fix (Single File: `src/pages/admin/AdminServices.tsx`)

Add two lines to the `.update()` call (around line 162, alongside the other fields):

```
price: editForm.price || '$',
rating: parseFloat(editForm.rating) || 0,
```

This ensures both rating and price persist when editing an existing service, matching the behavior already in place for creating new services.

### No Other Changes Needed
The rating already displays correctly on Explore and ServiceDetails pages -- this is purely a save-side bug in the admin edit flow.
