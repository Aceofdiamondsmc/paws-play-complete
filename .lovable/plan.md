

## Delete Account Bug — Root Cause & Fix

### The Problem

The edge function logs show: `"Database error deleting user"` with `code: "unexpected_failure"`.

When `auth.admin.deleteUser()` runs, Postgres tries to delete the row from `auth.users`. But two foreign key constraints **don't have `ON DELETE CASCADE` or `ON DELETE SET NULL`**, so they default to `RESTRICT` — blocking the deletion entirely.

The blocking foreign keys:
1. **`app_settings.updated_by`** → `REFERENCES auth.users(id)` — no ON DELETE action
2. **`service_submissions.approved_by`** → `REFERENCES auth.users(id)` — no ON DELETE action

### Fix

**Option A (recommended): Migration to fix the foreign keys**

Run a migration that drops and re-creates the two FK constraints with `ON DELETE SET NULL`:

```sql
-- Fix app_settings.updated_by FK
ALTER TABLE public.app_settings 
  DROP CONSTRAINT IF EXISTS app_settings_updated_by_fkey;
ALTER TABLE public.app_settings 
  ADD CONSTRAINT app_settings_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix service_submissions.approved_by FK
ALTER TABLE public.service_submissions 
  DROP CONSTRAINT IF EXISTS service_submissions_approved_by_fkey;
ALTER TABLE public.service_submissions 
  ADD CONSTRAINT service_submissions_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

This lets the user be deleted while preserving the submission/settings records (just nullifying the reference).

**Option B (belt-and-suspenders): Also update the edge function**

Update `delete-account/index.ts` to manually clean up data before calling `deleteUser()`, as a safety net against any future FK issues. This involves deleting rows from tables that reference the user but lack cascade. However, with Option A applied, this is optional.

### Summary

| Change | File |
|---|---|
| Migration: fix 2 FK constraints to `ON DELETE SET NULL` | New migration SQL |
| (Optional) Edge function: pre-delete cleanup | `supabase/functions/delete-account/index.ts` |

One migration fixes the issue. No code changes needed unless you want extra safety.

