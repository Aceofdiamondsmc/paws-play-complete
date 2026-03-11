

## Fix: Parks Map "Unauthorized" Error

The root cause is a mismatch between the client and edge function:

1. **Client** (`src/components/parks/ParksMap.tsx` line 147-153): Calls the edge function with no `Authorization` header
2. **Edge function** (`supabase/functions/mapbox-token/index.ts` line 31): Uses `supabase.auth.getClaims(token)` which is not a valid Supabase client method — it will always error

### Changes

**`src/components/parks/ParksMap.tsx`** — Send auth header with the request
- Get the current session via `supabase.auth.getSession()`
- Include `Authorization: Bearer <access_token>` and the `apikey` header in the fetch call

**`supabase/functions/mapbox-token/index.ts`** — Replace broken `getClaims` with `getUser`
- Replace `supabase.auth.getClaims(token)` with `supabase.auth.getUser()` which is the standard way to validate a JWT in edge functions

