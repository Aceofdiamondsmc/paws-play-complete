import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRequest {
  location: string; // City name or "lat,lng" format
  categories?: string[]; // Optional: specific categories to import
}

// Pet service search queries mapped to our categories
const SERVICE_SEARCHES = [
  { query: "dog walker", category: "Dog Walkers" },
  { query: "pet groomer dog groomer", category: "Groomers" },
  { query: "veterinarian vet clinic", category: "Vet Clinics" },
  { query: "dog trainer pet trainer", category: "Trainers" },
  { query: "dog daycare pet daycare", category: "Daycare" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - require admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ImportRequest = await req.json();
    const { location, categories } = body;

    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting import for location: ${location}`);

    // First, geocode the location to get coordinates
    let centerLat: number;
    let centerLng: number;

    if (location.includes(",")) {
      // Already lat,lng format
      const [lat, lng] = location.split(",").map(Number);
      centerLat = lat;
      centerLng = lng;
    } else {
      // Geocode the city name
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();

      if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
        return new Response(
          JSON.stringify({ error: `Could not find location: ${location}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      centerLat = geocodeData.results[0].geometry.location.lat;
      centerLng = geocodeData.results[0].geometry.location.lng;
    }

    console.log(`Geocoded to: ${centerLat}, ${centerLng}`);

    // Filter searches by requested categories if provided
    const searchesToRun = categories?.length
      ? SERVICE_SEARCHES.filter((s) => categories.includes(s.category))
      : SERVICE_SEARCHES;

    const importedServices: Array<{ name: string; category: string }> = [];
    const errors: string[] = [];

    // Run searches for each category
    for (const search of searchesToRun) {
      try {
        console.log(`Searching for: ${search.query}`);

        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${centerLat},${centerLng}&radius=16000&keyword=${encodeURIComponent(search.query)}&key=${GOOGLE_PLACES_API_KEY}`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
          console.error(`Search error for ${search.category}:`, searchData.status);
          errors.push(`${search.category}: ${searchData.status}`);
          continue;
        }

        const places = searchData.results || [];
        console.log(`Found ${places.length} results for ${search.category}`);

        // Insert each place
        for (const place of places.slice(0, 10)) { // Limit to 10 per category
          // Check if already exists by google_place_id
          const { data: existing } = await supabase
            .from("services")
            .select("id")
            .eq("google_place_id", place.place_id)
            .maybeSingle();

          if (existing) {
            console.log(`Skipping duplicate: ${place.name}`);
            continue;
          }

          const serviceData = {
            name: place.name,
            category: search.category,
            rating: place.rating || 4.0,
            price: "Contact for pricing",
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
            description: place.vicinity || null,
            google_place_id: place.place_id,
            photo_reference: place.photos?.[0]?.photo_reference || null,
            is_verified: false,
            is_featured: false,
            is_flagged: false,
            enrichment_status: "pending",
          };

          const { error: insertError } = await supabase
            .from("services")
            .insert(serviceData);

          if (insertError) {
            console.error(`Insert error for ${place.name}:`, insertError);
            errors.push(`Failed to insert ${place.name}`);
          } else {
            importedServices.push({ name: place.name, category: search.category });
            console.log(`Imported: ${place.name}`);
          }
        }
      } catch (searchErr) {
        console.error(`Error searching ${search.category}:`, searchErr);
        errors.push(`${search.category}: ${searchErr instanceof Error ? searchErr.message : "Unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: { lat: centerLat, lng: centerLng },
        imported: importedServices.length,
        services: importedServices,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import services error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
