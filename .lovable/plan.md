

## Fix: Remove Restrictive Dog Update Trigger

### Problem

A database trigger `trg_enforce_dogs_update_columns` on the `dogs` table blocks ALL column changes except `vaccination_certified`. When an owner tries to update any field (name, weight, breed, bio, etc.), the trigger raises:

> "Only vaccination_certified can be updated by owners"

This was likely added as a misguided security measure to protect vaccination fields, but it completely breaks normal dog profile editing.

### Root Cause

The trigger logic is inverted. When `vaccination_certified` changes, it forces all other columns back to their old values. When any other column changes (without vaccination_certified changing), it throws an error. This means owners literally cannot edit their dogs.

### Solution

**Drop the trigger and its function** via a database migration:

```sql
DROP TRIGGER IF EXISTS trg_enforce_dogs_update_columns ON public.dogs;
DROP FUNCTION IF EXISTS public.enforce_dogs_update_columns();
```

**Why this is safe**: The existing RLS policies already properly restrict updates — owners can only update their own dogs (`auth.uid() = owner_id`). The `vet_verified` field (which is the sensitive admin-only field) is protected by the separate admin-only RLS policy (`admins_update_vet_verified`). No additional trigger is needed.

### No code changes required

The `PackMemberForm.tsx` and `useDogs.tsx` code is already correct — once this trigger is removed, dog editing will work normally on both web and native builds.

