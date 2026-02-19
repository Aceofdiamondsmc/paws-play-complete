
## Fix: Replace `getClaims` with `getUser` Across All Edge Functions

### Root Cause

The function `supabase.auth.getClaims(token)` **does not exist** in the Supabase JS SDK v2. It was never a real method. When called, it throws an error that gets caught silently, returning a `401 Unauthorized` response — which is exactly what the logs confirm for the most recent attempts.

The correct SDK v2 method is `supabase.auth.getUser()`, which validates the JWT from the Authorization header and returns the authenticated user. Since the Supabase client is already initialized with `{ global: { headers: { Authorization: authHeader } } }`, calling `getUser()` with no arguments automatically uses the bearer token.

### All Affected Functions (9 total)

| Function | Role Needed | Impact if broken |
|---|---|---|
| `send-test-notification` | Admin | Push notification testing |
| `mapbox-token` | Any user | Maps won't load for authenticated users |
| `geocode-parks` | Admin | Park geocoding |
| `explore-assistant` | Any user | AI pet service assistant |
| `generate-park-description` | Any user | AI park descriptions |
| `generate-service-images` | Admin | Service image generation |
| `vet-service` | Admin | Service vetting |
| `import-services` | Admin | Service importing |
| `google-places` | Any user | Location search |

### The Fix Pattern

Replace this pattern in every function:
```typescript
// BROKEN - getClaims does not exist
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 ... });
}
const userId = claimsData.claims.sub;
```

With the correct SDK v2 pattern:
```typescript
// CORRECT - getUser() validates the JWT automatically
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 ... });
}
const userId = user.id;
```

### What Will Be Changed

All 9 edge functions will have their `getClaims` call replaced with `getUser()`. No other logic changes — admin checks, payload parsing, and OneSignal calls remain exactly the same.

### Technical Details

- Functions that only need user identity (no admin check): `mapbox-token`, `explore-assistant`, `generate-park-description`, `google-places` — just need `user.id` replaced
- Functions that also check admin role: `send-test-notification`, `geocode-parks`, `generate-service-images`, `vet-service`, `import-services` — same fix, `userId` flows into the existing admin check logic unchanged
- No database migrations, no secret changes, no UI changes needed
- All 9 functions will be redeployed automatically after the fix
