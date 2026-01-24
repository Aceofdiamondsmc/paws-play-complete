import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSearchRequest {
  action: "search" | "nearby" | "details" | "photo";
  query?: string;
  location?: { lat: number; lng: number };
  radius?: number;
  type?: string;
  placeId?: string;
  photoReference?: string;
  maxWidth?: number;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photos?: Array<{ photo_reference: string; height: number; width: number }>;
  opening_hours?: { open_now?: boolean };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Google Places request from user: ${userId}`);

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: PlaceSearchRequest = await req.json();
    const { action, query, location, radius = 5000, type, placeId, photoReference, maxWidth = 400 } = body;

    console.log(`Google Places API request: action=${action}`, { query, location, placeId });

    let url: string;
    let response: Response;

    switch (action) {
      case "search":
        // Text Search API - search for places by query
        if (!query) {
          return new Response(
            JSON.stringify({ error: "Query is required for search action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
        
        if (location) {
          url += `&location=${location.lat},${location.lng}&radius=${radius}`;
        }
        if (type) {
          url += `&type=${type}`;
        }
        
        response = await fetch(url);
        break;

      case "nearby":
        // Nearby Search API - find places near a location
        if (!location) {
          return new Response(
            JSON.stringify({ error: "Location is required for nearby action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}`;
        
        if (type) {
          url += `&type=${type}`;
        }
        if (query) {
          url += `&keyword=${encodeURIComponent(query)}`;
        }
        
        response = await fetch(url);
        break;

      case "details":
        // Place Details API - get detailed info about a place
        if (!placeId) {
          return new Response(
            JSON.stringify({ error: "Place ID is required for details action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,photos,opening_hours,geometry,types,url&key=${GOOGLE_PLACES_API_KEY}`;
        
        response = await fetch(url);
        break;

      case "photo":
        // Place Photos API - get a photo URL
        if (!photoReference) {
          return new Response(
            JSON.stringify({ error: "Photo reference is required for photo action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Return the photo URL directly (Google will redirect to the actual image)
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
        
        return new Response(
          JSON.stringify({ photoUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: search, nearby, details, or photo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const data = await response.json();
    
    console.log(`Google Places API response status: ${data.status}`);
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: data.error_message || `Google Places API error: ${data.status}`,
          status: data.status 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: data.status,
        results: data.results || [],
        result: data.result || null,
        next_page_token: data.next_page_token || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Google Places function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
