

## Plan: Create `get-weather` Edge Function and Weather Widget

### Current State
- No weather component or API call exists in the codebase
- `OPENWEATHER_API_KEY` is **not** in Supabase secrets (only in `.env` as a frontend variable)
- The Explore/Services page already geolocates the user (has `userCoords` state)

### Step 1: Add the `OPENWEATHER_API_KEY` secret
Use the secrets tool to prompt the user to store their OpenWeather key as a Supabase secret. The key `9365372172451f0bdef14d1d94423ff2` is already in `.env` but needs to be in Supabase secrets for the edge function.

### Step 2: Create `supabase/functions/get-weather/index.ts`
- Accept `{ lat, lon }` in the request body
- Require authentication via `Authorization` header + `supabase.auth.getUser()`
- Fetch from `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=imperial`
- Return weather data (temp, description, icon, humidity, wind)
- Add CORS headers
- Add `verify_jwt = false` to `supabase/config.toml`

### Step 3: Create `src/components/explore/WeatherWidget.tsx`
A compact card component that:
- Takes `lat`/`lon` props
- Calls the edge function via `supabase.functions.invoke('get-weather', { body: { lat, lon } })`
- Displays current temp, weather icon, description, and basic details (humidity, wind)
- Shows a skeleton while loading
- Styled to fit the Services page aesthetic

### Step 4: Integrate into `src/pages/Explore.tsx`
- Import `WeatherWidget`
- Render it below the category pills when `userCoords` is available
- Pass the user's lat/lon coordinates

### Files changed
| File | Action |
|------|--------|
| `supabase/functions/get-weather/index.ts` | Create |
| `supabase/config.toml` | Add `[functions.get-weather]` |
| `src/components/explore/WeatherWidget.tsx` | Create |
| `src/pages/Explore.tsx` | Add WeatherWidget import + render |

