
The error is clear: PostgREST can't choose between two overloaded versions of `approve_park_suggestion` — the old single-arg version `(suggestion_id uuid)` and the new two-arg version `(suggestion_id uuid, admin_notes_text text)`. The migration created a NEW function rather than replacing the old one, so both now exist.

The client calls `supabase.rpc('approve_park_suggestion', { suggestion_id: id })` with only one arg, which matches both signatures → ambiguity error.

## Fix

One small migration: drop the old single-arg version, keep the new one.

```sql
DROP FUNCTION IF EXISTS public.approve_park_suggestion(uuid);
```

That's it. The two-arg version already has `DEFAULT NULL` on `admin_notes_text`, so calls with one arg will resolve cleanly to it.

## After deploy
Refresh, click Approve on the Martinique suggestion — it will go through, copy `country` + `zip_code` into `parks`, and then the geocoder edge function can fill in coords (or admin can paste them manually).
