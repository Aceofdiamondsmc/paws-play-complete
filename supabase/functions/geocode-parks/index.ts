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
    // Auth check - require admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Admin check using service role client
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);

    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminRow) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");

    if (!MAPBOX_TOKEN) {
      throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    }

    // Fetch parks with missing coordinates but valid addresses
    const { data: parks, error: fetchError } = await supabase
      .from("parks")
      .select("Id, name, address, latitude, longitude, country")
      .not("address", "is", null)
      .or("latitude.is.null,longitude.is.null");

    if (fetchError) {
      throw new Error(`Failed to fetch parks: ${fetchError.message}`);
    }

    const parksToGeocode = (parks || []).filter((p: any) => {
      const lat = p.latitude;
      const lng = p.longitude;
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

    for (const park of parksToGeocode.slice(0, 50)) {
      try {
        // Include country in the geocoding query for better international accuracy.
        // No `country=` filter — Mapbox can resolve any country worldwide.
        const fullAddress = [park.address, (park as any).country]
          .filter(Boolean)
          .join(', ');
        const query = encodeURIComponent(fullAddress);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        );

        if (!response.ok) {
          results.failed++;
          results.errors.push(`Failed to geocode ${park.name}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          // Update lat/lng only; let a trigger or separate step handle geom
          const validLat = typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90;
          const validLng = typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180;
          if (!validLat || !validLng) {
            results.failed++;
            results.errors.push(`Invalid coordinates for ${park.name}: ${lat}, ${lng}`);
            continue;
          }

          const { error: updateError } = await supabase
            .from("parks")
            .update({ 
              latitude: lat, 
              longitude: lng,
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
