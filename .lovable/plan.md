

## Add Authentication to get-weather Edge Function

### What
Add JWT authentication to the `get-weather` edge function so only logged-in users can call it, preventing API quota abuse.

### Changes

**File: `supabase/functions/get-weather/index.ts`**
- Add auth header check and Supabase client user verification before processing the weather request
- Merge the provided auth logic with the existing CORS headers, request parsing, and OpenWeather API call
- Keep CORS preflight (`OPTIONS`) handling before the auth check so browsers can still negotiate

**File: `src/components/explore/WeatherWidget.tsx`**
- No changes needed — `supabase.functions.invoke()` already sends the auth token automatically

### Final function structure
1. CORS preflight check (existing)
2. Auth header validation (new)
3. Supabase client creation + `getUser()` verification (new)
4. Parse `lat`/`lon` from body (existing)
5. Fetch OpenWeather API (existing)
6. Return weather data (existing)

This addresses the "Weather Proxy Endpoint Requires No Authentication" security finding.

