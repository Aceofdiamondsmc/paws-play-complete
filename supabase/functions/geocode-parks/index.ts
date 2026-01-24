import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MAPBOX_TOKEN) {
      throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch parks with missing coordinates but valid addresses
    const { data: parks, error: fetchError } = await supabase
      .from("parks")
      .select("Id, name, address, latitude, longitude")
      .not("address", "is", null)
      .or("latitude.is.null,longitude.is.null");

    if (fetchError) {
      throw new Error(`Failed to fetch parks: ${fetchError.message}`);
    }

    const parksToGeocode = (parks || []).filter((p: any) => {
      const lat = p.latitude;
      const lng = p.longitude;
      // Check if lat/lng are invalid (null, NaN, or out of bounds)
      const isInvalid = 
        lat == null || lng == null ||
        (typeof lat === 'number' && (isNaN(lat) || !isFinite(lat))) ||
        (typeof lng === 'number' && (isNaN(lng) || !isFinite(lng))) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180;
      return isInvalid && p.address;
    });

    console.log(`Found ${parksToGeocode.length} parks to geocode`);

    const results = {
      geocoded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches to avoid rate limiting
    for (const park of parksToGeocode.slice(0, 50)) {
      try {
        const query = encodeURIComponent(park.address);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`
        );

        if (!response.ok) {
          results.failed++;
          results.errors.push(`Failed to geocode ${park.name}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          // Update the park in the database
          const { error: updateError } = await supabase
            .from("parks")
            .update({ 
              latitude: lat, 
              longitude: lng,
              // Also update the geom column with a valid PostGIS point
              geom: `SRID=4326;POINT(${lng} ${lat})`
            })
            .eq("Id", park.Id);

          if (updateError) {
            results.failed++;
            results.errors.push(`Failed to update ${park.name}: ${updateError.message}`);
          } else {
            results.geocoded++;
            console.log(`Geocoded: ${park.name} -> ${lat}, ${lng}`);
          }
        } else {
          results.failed++;
          results.errors.push(`No results for ${park.name}`);
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: unknown) {
        results.failed++;
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push(`Error geocoding ${park.name}: ${message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: parksToGeocode.length,
        processed: results.geocoded + results.failed,
        ...results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Geocoding error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
