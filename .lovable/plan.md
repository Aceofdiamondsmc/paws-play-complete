

## Auto-Geocode Address in Admin Service Form

### Problem
Currently, admins must manually type latitude/longitude coordinates for new services. This is tedious and error-prone.

### Solution
Add a "Geocode" button next to the address field that automatically fetches coordinates from the Mapbox Geocoding API using the entered address. The lat/lng fields auto-populate, but remain editable for manual override.

### Changes (Single File)

**`src/pages/admin/AdminServices.tsx`**

1. **Add geocoding state** -- `isGeocoding` boolean for loading indicator.

2. **Add a `handleGeocode` function** that:
   - Fetches the Mapbox token from the existing `mapbox-token` edge function
   - Calls the Mapbox Geocoding API with the address string
   - Extracts lat/lng from the first result
   - Auto-fills the latitude and longitude fields
   - Shows a toast on success or failure

3. **Add a "Geocode" button** next to the Address input (or below it) with a MapPin icon. Disabled when address is empty or geocoding is in progress.

4. **Keep lat/lng fields editable** so admins can still manually adjust if needed.

### Technical Detail

```text
+------------------------------------------+
| Address: [123 Main St, Boston, MA      ] |
|          [ MapPin  Geocode ]             |
|                                          |
| Latitude: [42.3601]  Longitude: [-71.05] |
|   (auto-filled, still editable)          |
+------------------------------------------+
```

The geocoding uses the same Mapbox token edge function (`mapbox-token`) already used by the Parks and Services maps. The API call is:
```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json?access_token={token}
```

No new dependencies or database changes needed.
