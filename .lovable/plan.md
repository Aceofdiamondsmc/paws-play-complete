

## Plan: Fix Ask AI for iOS Native Build

### Problem

The `ExploreAssistant.tsx` frontend component hardcodes both the Supabase URL and the anon key. On the native iOS build (Capacitor), the origin is `capacitor://localhost`, which can cause CORS preflight failures because the edge function's `Access-Control-Allow-Headers` is missing several headers the Supabase client sends.

Additionally, the frontend should use the logged-in user's session token (not just the anon key) so the edge function's auth check works properly.

### Changes

**1. Edge function CORS fix (`supabase/functions/explore-assistant/index.ts`)**

Update the CORS headers to include all Supabase client headers:

```
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

No other edge function changes needed — it already uses `LOVABLE_API_KEY` correctly.

**2. Frontend fix (`src/components/explore/ExploreAssistant.tsx`)**

- Replace the hardcoded URL with `import.meta.env.VITE_SUPABASE_URL` + `/functions/v1/explore-assistant`
- Replace the hardcoded anon key with the user's actual session token from the Supabase client (falling back to the anon key if no session)
- Import `supabase` from the client integration to get the session

This ensures the request works from any origin (web, PWA, or Capacitor native) and sends a valid auth token.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/explore-assistant/index.ts` | Expand CORS `Access-Control-Allow-Headers` |
| `src/components/explore/ExploreAssistant.tsx` | Use env var for URL, use session token for auth |

