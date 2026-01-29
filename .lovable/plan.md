

# Fix Plan: Dog Profile Save Error ("cannot insert into view dogs_discovery")

## Problem Summary

When adding a new dog on the **published** site (pawsplayrepeat.app), clicking Save fails with:
> "Failed to save: cannot insert into view dogs_discovery"

The frontend code correctly targets the `dogs` table, but the auto-generated Supabase types file contains an incorrect foreign key reference that can influence the Supabase client behavior.

---

## Root Cause Analysis

The file `src/integrations/supabase/types.ts` is auto-generated from the database schema. It contains this incorrect reference:

```text
File: src/integrations/supabase/types.ts (lines 787-793)

{
  foreignKeyName: "posts_dog_id_fkey"
  columns: ["dog_id"]
  isOneToOne: false
  referencedRelation: "dogs_discovery"  <-- WRONG
  referencedColumns: ["id"]
}
```

The `posts_dog_id_fkey` foreign key should reference the `dogs` **table**, not the `dogs_discovery` **view**.

This happens because when PostgreSQL introspects the schema, views that expose the same `id` column as the base table can sometimes be picked up as the referenced relation. The Supabase type generator then propagates this incorrect reference.

---

## Solution

### Step 1: Add INSTEAD OF Trigger to Make View Insertable (Database Migration)

Create an `INSTEAD OF INSERT` trigger on the `dogs_discovery` view that redirects any accidental insert attempts to the base `dogs` table. This is a safeguard that prevents the error even if the client somehow targets the view.

```sql
CREATE OR REPLACE FUNCTION redirect_dogs_discovery_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dogs (
    owner_id, name, breed, size, energy_level, bio, 
    avatar_url, age_years, weight_lbs, health_notes, play_style
  ) VALUES (
    NEW.owner_id, NEW.name, NEW.breed, NEW.size, NEW.energy_level, NEW.bio,
    NEW.avatar_url, NEW.age_years, NULL, NULL, NEW.play_style
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER dogs_discovery_insert_redirect
INSTEAD OF INSERT ON dogs_discovery
FOR EACH ROW EXECUTE FUNCTION redirect_dogs_discovery_insert();
```

### Step 2: Regenerate Supabase Types

After the migration, the Supabase types will be regenerated. The new types should correctly reference the `dogs` table if the foreign key is properly defined.

If the types still show `dogs_discovery`, we can manually correct the generated types file (though this is a temporary fix since the file gets regenerated).

---

## Technical Details

### Why This Works

1. **INSTEAD OF Trigger**: PostgreSQL allows triggers on views to intercept INSERT/UPDATE/DELETE operations. By adding an `INSTEAD OF INSERT` trigger, any insert to `dogs_discovery` will be silently redirected to the `dogs` table.

2. **No Frontend Changes Required**: The existing code in `useDogs.tsx` already correctly targets the `dogs` table. This fix is purely a database-level safeguard.

3. **Backward Compatible**: This change does not affect any existing read operations on the view.

### Files Affected

| Location | Change |
|----------|--------|
| Database | Add INSTEAD OF INSERT trigger on `dogs_discovery` view |
| `src/integrations/supabase/types.ts` | Will be auto-regenerated after migration |

---

## Alternative Approach (If Trigger Fails)

If the INSTEAD OF trigger approach doesn't work (some PostgreSQL configurations may not support it on views with security_invoker), we can:

1. Drop and recreate the view without the `security_invoker` option
2. Add explicit RLS policies to the base table that replicate the view's filtering logic

---

## Post-Implementation

After applying this fix:
1. The "cannot insert into view" error will no longer occur
2. Dog profiles will save correctly to the `dogs` table
3. The `dogs_discovery` view will continue to work for reading/discovery
4. **User should republish the app** to ensure the published site uses the latest code

