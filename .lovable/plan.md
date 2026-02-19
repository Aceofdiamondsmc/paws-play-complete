

## Update `send-test-notification` to Use Service Role Key

### Problem
With RLS tightened on the `profiles` table, the edge function can no longer query `admin_users` (or any RLS-protected table) using the caller's anon-key client, because the admin check query may fail depending on policy configuration.

### Solution
Use two Supabase clients:
1. **Anon client** (with the caller's JWT) -- solely to verify the caller's identity via `auth.getClaims()`
2. **Service-role client** -- to perform the admin check against `admin_users` (bypasses RLS)

This keeps auth verification secure while allowing the function to read RLS-protected data.

### Changes

**File**: `supabase/functions/send-test-notification/index.ts`

- **Line 25-29**: Keep the existing anon client for JWT verification (auth.getClaims)
- **After line 40**: Create a second service-role client:
  ```ts
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  ```
- **Line 43**: Change the admin check query from `supabase.from(...)` to `adminClient.from(...)` so it bypasses RLS
- The rest of the function (OneSignal call, targetUserId handling) remains unchanged

### Why Two Clients?
- The anon client with the caller's JWT is needed to securely verify who is calling the function (we can't trust the request body alone)
- The service-role client bypasses RLS to read `admin_users` and any future queries against protected tables
- This is the standard Supabase edge function pattern for admin operations

### No Other Files Changed
- `targetUserId` is already dynamically passed from the request body (not hardcoded)
- `SUPABASE_SERVICE_ROLE_KEY` is already available as a default Supabase secret -- no need to add it

