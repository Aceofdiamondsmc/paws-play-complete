import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceData {
  id: number;
  name: string;
  category: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  price: string;
}

interface GooglePlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
}

interface EnrichmentResult {
  polishedDescription: string;
  suggestedCategory: string;
  isFlagged: boolean;
  flagReason: string | null;
}

async function verifyWithGooglePlaces(
  serviceName: string,
  latitude: number | null,
  longitude: number | null
): Promise<{ verified: boolean; place?: GooglePlaceResult }> {
  const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY not configured");
    return { verified: false };
  }

  try {
    // Use Places Text Search to find the business
    let searchQuery = serviceName;
    if (latitude && longitude) {
      // Use Nearby Search if we have coordinates
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=500&keyword=${encodeURIComponent(serviceName)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        // Find best match by name similarity
        const bestMatch = data.results.find((place: any) => 
          place.name.toLowerCase().includes(serviceName.toLowerCase().split(' ')[0]) ||
          serviceName.toLowerCase().includes(place.name.toLowerCase().split(' ')[0])
        ) || data.results[0];
        
        return {
          verified: true,
          place: {
            place_id: bestMatch.place_id,
            formatted_address: bestMatch.vicinity || bestMatch.formatted_address,
            geometry: bestMatch.geometry,
            name: bestMatch.name,
          },
        };
      }
    }

    // Fallback to text search
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + " pet services")}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const textResponse = await fetch(textSearchUrl);
    const textData = await textResponse.json();
    
    if (textData.status === "OK" && textData.results && textData.results.length > 0) {
      const place = textData.results[0];
      return {
        verified: true,
        place: {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          name: place.name,
        },
      };
    }

    return { verified: false };
  } catch (error) {
    console.error("Google Places verification error:", error);
    return { verified: false };
  }
}

async function enrichWithGemini(
  name: string,
  description: string | null,
  category: string,
  price: string
): Promise<EnrichmentResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return {
      polishedDescription: description || "",
      suggestedCategory: category,
      isFlagged: false,
      flagReason: null,
    };
  }

  const validCategories = ["Dog Walkers", "Daycare", "Vet Clinics", "Trainers", "Groomers"];

  const prompt = `You are a fun, playful pet services copywriter who LOVES dog puns and humor! Your job is to make pet service descriptions tail-waggin' good while keeping them professional.

Sprinkle in dog-themed humor and puns like:
- "tail-waggin' good service"
- "paw-fect for your pup"
- "barking amazing care"
- "fur real the best"
- "pawsitively wonderful"
- "doggone great"
- "unleash the fun"
- "no ruff days here"

Service Name: ${name}
Current Category: ${category}
Current Description: ${description || "No description provided"}
Price: ${price}

Please respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
{
  "polishedDescription": "A fun, engaging 2-3 sentence description with 1-2 dog puns naturally woven in. Keep it professional but playful!",
  "suggestedCategory": "The most accurate category from: ${validCategories.join(", ")}",
  "isFlagged": true/false - Set to true ONLY if the description is missing critical info like: specific services offered, or if it seems spam/inappropriate,
  "flagReason": "If flagged, explain what's missing. Otherwise null"
}

Important rules:
- Make it fun and memorable with dog-themed wordplay
- Keep descriptions concise (2-3 sentences max)
- Only flag if truly missing critical business info
- Price info is NOT required to avoid flagging
- Let the business personality shine through with a dash of humor`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a professional editor for pet service listings. Always respond with valid JSON only, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return {
          polishedDescription: description || "",
          suggestedCategory: category,
          isFlagged: false,
          flagReason: null,
        };
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean up potential markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const result = JSON.parse(cleanContent);
    
    // Validate suggested category
    if (!validCategories.includes(result.suggestedCategory)) {
      result.suggestedCategory = category; // Keep original if invalid
    }

    return {
      polishedDescription: result.polishedDescription || description || "",
      suggestedCategory: result.suggestedCategory || category,
      isFlagged: result.isFlagged === true,
      flagReason: result.flagReason || null,
    };
  } catch (error) {
    console.error("Gemini enrichment error:", error);
    return {
      polishedDescription: description || "",
      suggestedCategory: category,
      isFlagged: false,
      flagReason: null,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid user with admin/moderator role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
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
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Vet service request from user: ${userId}`);

    // Check if user has admin or moderator role
    const { data: userRole, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'moderator'])
      .single();

    if (roleError || !userRole) {
      console.error("Role check failed:", roleError?.message || "No admin/moderator role found");
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin or moderator access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${userId} authorized with role: ${userRole.role}`);

    const { serviceId, action } = await req.json();
    
    // Create Supabase client with service role for updates (after auth check)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper function to process a single service
    async function processService(svcId: number): Promise<{ success: boolean; verified: boolean; flagged: boolean; error?: string }> {
      try {
        const { data: service, error: fetchError } = await supabase
          .from("services")
          .select("*")
          .eq("id", svcId)
          .single();

        if (fetchError || !service) {
          return { success: false, verified: false, flagged: false, error: `Service not found: ${fetchError?.message}` };
        }

        // Mark as processing
        await supabase
          .from("services")
          .update({ enrichment_status: "processing" })
          .eq("id", svcId);

        // Store original description if not already stored
        if (!service.original_description && service.description) {
          await supabase
            .from("services")
            .update({ original_description: service.description })
            .eq("id", svcId);
        }

        // Run verification and enrichment in parallel
        const [verificationResult, enrichmentResult] = await Promise.all([
          verifyWithGooglePlaces(service.name, service.latitude, service.longitude),
          enrichWithGemini(service.name, service.description, service.category, service.price),
        ]);

        // Prepare update data
        const updateData: Record<string, any> = {
          enrichment_status: "completed",
          enriched_description: enrichmentResult.polishedDescription,
          suggested_category: enrichmentResult.suggestedCategory,
          is_flagged: enrichmentResult.isFlagged,
          flag_reason: enrichmentResult.flagReason,
          updated_at: new Date().toISOString(),
        };

        if (verificationResult.verified && verificationResult.place) {
          updateData.is_verified = true;
          updateData.google_place_id = verificationResult.place.place_id;
          updateData.verified_address = verificationResult.place.formatted_address;
          updateData.verified_latitude = verificationResult.place.geometry.location.lat;
          updateData.verified_longitude = verificationResult.place.geometry.location.lng;
        }

        // Update the service
        const { error: updateError } = await supabase
          .from("services")
          .update(updateData)
          .eq("id", svcId);

        if (updateError) {
          return { success: false, verified: false, flagged: false, error: `Update failed: ${updateError.message}` };
        }

        return {
          success: true,
          verified: verificationResult.verified,
          flagged: enrichmentResult.isFlagged,
        };
      } catch (e) {
        // Mark as failed
        await supabase
          .from("services")
          .update({ enrichment_status: "failed" })
          .eq("id", svcId);
        
        return { success: false, verified: false, flagged: false, error: String(e) };
      }
    }

    if (action === "process_single" && serviceId) {
      const result = await processService(serviceId);
      
      if (!result.success) {
        throw new Error(result.error || "Processing failed");
      }

      return new Response(
        JSON.stringify({
          success: true,
          serviceId,
          verified: result.verified,
          flagged: result.flagged,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "process_pending") {
      // Process all pending services
      const { data: pendingServices, error: listError } = await supabase
        .from("services")
        .select("id")
        .eq("enrichment_status", "pending")
        .limit(10); // Process in batches

      if (listError) {
        throw new Error(`Failed to fetch pending services: ${listError.message}`);
      }

      if (!pendingServices || pendingServices.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No pending services", processed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process each service sequentially to avoid rate limits
      const results = [];
      for (const svc of pendingServices) {
        const result = await processService(svc.id);
        results.push({ id: svc.id, ...result });
      }

      return new Response(
        JSON.stringify({ success: true, processed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action. Use 'process_single' or 'process_pending'");
  } catch (error) {
    console.error("Vet service error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
