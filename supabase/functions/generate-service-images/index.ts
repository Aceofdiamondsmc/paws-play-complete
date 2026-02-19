import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Variety elements for unique image generation
const DOG_BREEDS = [
  'Golden Retriever', 'Labrador', 'German Shepherd', 'French Bulldog', 'Poodle',
  'Beagle', 'Corgi', 'Husky', 'Border Collie', 'Australian Shepherd',
  'Dachshund', 'Shiba Inu', 'Bernese Mountain Dog', 'Cavalier King Charles Spaniel',
  'Boston Terrier', 'Boxer', 'Great Dane', 'Maltese', 'Pomeranian', 'Samoyed'
];

const TIMES_OF_DAY = [
  'golden hour morning light', 'bright midday sunshine', 'warm afternoon glow',
  'soft overcast daylight', 'early morning sunrise', 'late afternoon golden light'
];

const SETTINGS = {
  'Dog Walkers': [
    'urban city park with modern skyline', 'leafy suburban neighborhood street',
    'scenic hiking trail in nature', 'beachfront boardwalk', 'tree-lined boulevard',
    'quiet residential area with gardens', 'riverside walking path', 'botanical garden'
  ],
  'Groomers': [
    'modern minimalist salon with white walls', 'cozy boutique grooming studio',
    'bright airy space with large windows', 'upscale spa-like environment',
    'rustic chic grooming parlor', 'contemporary pet salon with plants'
  ],
  'Vet Clinics': [
    'modern clinical space with warm touches', 'friendly neighborhood veterinary office',
    'state-of-the-art medical facility', 'cozy family veterinary practice',
    'bright welcoming animal hospital', 'professional medical examination room'
  ],
  'Trainers': [
    'open grassy training field', 'indoor training facility with equipment',
    'fenced backyard training area', 'agility course setup', 'park training session',
    'beach training environment', 'forest clearing training spot'
  ],
  'Daycare': [
    'spacious indoor play area with colorful toys', 'outdoor play yard with shade structures',
    'modern facility with climbing equipment', 'cozy nap room with dog beds',
    'splash pad water play area', 'supervised group play space'
  ]
};

const CAMERA_ANGLES = [
  'eye-level perspective', 'slight low angle looking up', 'overhead three-quarter view',
  'candid side profile', 'dynamic action shot', 'intimate close-up portrait'
];

const MOODS = [
  'joyful and energetic', 'calm and peaceful', 'playful and fun',
  'professional and trustworthy', 'warm and welcoming', 'friendly and approachable'
];

// Pick random element from array
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick multiple random unique elements
function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

// Generate a unique, varied prompt for a service
function generateUniquePrompt(service: {
  name: string;
  category: string;
  description?: string | null;
  enriched_description?: string | null;
  verified_address?: string | null;
}): string {
  const breeds = pickMultiple(DOG_BREEDS, 2);
  const timeOfDay = pickRandom(TIMES_OF_DAY);
  const categorySettings = SETTINGS[service.category as keyof typeof SETTINGS] || SETTINGS['Daycare'];
  const setting = pickRandom(categorySettings);
  const angle = pickRandom(CAMERA_ANGLES);
  const mood = pickRandom(MOODS);

  // Extract useful details from description
  let descriptionDetails = '';
  const desc = service.enriched_description || service.description || '';
  if (desc) {
    // Extract key adjectives or features (first 100 chars, cleaned)
    const cleanDesc = desc.slice(0, 100).replace(/[^\w\s,]/g, '').trim();
    if (cleanDesc.length > 20) {
      descriptionDetails = `, inspired by: ${cleanDesc}`;
    }
  }

  // Add location flavor if available
  let locationFlavor = '';
  if (service.verified_address) {
    const addressParts = service.verified_address.split(',');
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : '';
    if (city && city.length > 2) {
      locationFlavor = `, ${city} local style`;
    }
  }

  const categoryPrompts: Record<string, string> = {
    'Dog Walkers': `Professional candid photo of a friendly dog walker with a ${breeds[0]} and a ${breeds[1]} on leashes, ${setting}, ${timeOfDay}, ${angle}, ${mood} atmosphere${descriptionDetails}${locationFlavor}, authentic lifestyle photography, high quality, 4k, unique composition`,
    
    'Groomers': `Professional photo of a skilled groomer carefully styling a beautiful ${breeds[0]}, ${setting}, ${timeOfDay}, ${angle}, ${mood} atmosphere${descriptionDetails}${locationFlavor}, spa-like quality, authentic candid moment, high quality, 4k`,
    
    'Vet Clinics': `Professional photo of a caring veterinarian gently examining a ${breeds[0]}, ${setting}, ${timeOfDay}, ${angle}, ${mood} atmosphere${descriptionDetails}${locationFlavor}, medical professionalism with warmth, high quality, 4k`,
    
    'Trainers': `Professional action photo of an experienced dog trainer working with an attentive ${breeds[0]}, ${setting}, ${timeOfDay}, ${angle}, ${mood} atmosphere${descriptionDetails}${locationFlavor}, dynamic training moment, positive reinforcement visible, high quality, 4k`,
    
    'Daycare': `Professional photo of happy ${breeds[0]} and ${breeds[1]} playing together, ${setting}, ${timeOfDay}, ${angle}, ${mood} atmosphere${descriptionDetails}${locationFlavor}, joyful dogs at play, supervised environment, high quality, 4k`,
  };

  const basePrompt = categoryPrompts[service.category] || categoryPrompts['Daycare'];
  
  // Add service name for uniqueness
  return `${basePrompt}. For "${service.name}" pet service business. Make this image distinctly unique.`;
}

interface Service {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  description?: string | null;
  enriched_description?: string | null;
  verified_address?: string | null;
}

async function generateImageForService(
  supabase: any,
  service: Service,
  lovableApiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uniquePrompt = generateUniquePrompt(service);

    console.log(`Generating unique image for service ${service.id}: ${service.name}`);
    console.log(`Prompt: ${uniquePrompt.slice(0, 200)}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: uniquePrompt }],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error for service ${service.id}:`, errorText);
      return { success: false, error: `AI gateway error: ${response.status}` };
    }

    const data = await response.json();
    const base64ImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64ImageUrl) {
      console.error(`No image generated for service ${service.id}`);
      return { success: false, error: 'No image in response' };
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = base64ImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage with unique filename including timestamp and random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `service-${service.id}-${Date.now()}-${randomSuffix}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`Upload error for service ${service.id}:`, uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update service record
    const { error: updateError } = await supabase
      .from('services')
      .update({ image_url: publicUrl })
      .eq('id', service.id);

    if (updateError) {
      console.error(`Update error for service ${service.id}:`, updateError);
      return { success: false, error: `Database update failed: ${updateError.message}` };
    }

    console.log(`Successfully generated unique image for service ${service.id}: ${publicUrl}`);
    return { success: true };
  } catch (error) {
    console.error(`Error processing service ${service.id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if an image URL is likely broken
function isLikelyBrokenUrl(url: string | null): boolean {
  if (!url) return true;
  
  const brokenPatterns = [
    'petworks.com',
    'example.com',
    'placeholder',
    'via.placeholder',
    'dummyimage',
  ];
  
  return brokenPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

serve(async (req) => {
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Admin check using service role client
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { action, serviceId, limit = 5 } = await req.json();

    if (action === "process_single" && serviceId) {
      // Process a single service - fetch with description fields
      const { data: service, error } = await supabase
        .from('services')
        .select('id, name, category, image_url, description, enriched_description, verified_address')
        .eq('id', serviceId)
        .single();

      if (error || !service) {
        throw new Error(`Service not found: ${serviceId}`);
      }

      const result = await generateImageForService(supabase, service, LOVABLE_API_KEY);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "process_batch") {
      // Fetch services that need images - include description fields for variety
      const { data: services, error } = await supabase
        .from('services')
        .select('id, name, category, image_url, description, enriched_description, verified_address')
        .order('id', { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch services: ${error.message}`);
      }

      // Filter to services with missing or broken images
      const servicesNeedingImages = (services as Service[]).filter(s => 
        !s.image_url || 
        isLikelyBrokenUrl(s.image_url) ||
        !s.image_url.includes('supabase')
      ).slice(0, limit);

      console.log(`Found ${servicesNeedingImages.length} services needing images`);

      const results: Array<{ id: number; name: string; success: boolean; error?: string }> = [];

      for (const service of servicesNeedingImages) {
        const result = await generateImageForService(supabase, service, LOVABLE_API_KEY);
        results.push({
          id: service.id,
          name: service.name,
          ...result
        });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.success).length;

      return new Response(JSON.stringify({
        processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "get_status") {
      // Get count of services needing images
      const { data: services, error } = await supabase
        .from('services')
        .select('id, image_url');

      if (error) {
        throw new Error(`Failed to fetch services: ${error.message}`);
      }

      const needsImage = (services as Service[]).filter(s => 
        !s.image_url || 
        isLikelyBrokenUrl(s.image_url) ||
        !s.image_url.includes('supabase')
      ).length;

      const hasImage = services.length - needsImage;

      return new Response(JSON.stringify({
        total: services.length,
        hasValidImage: hasImage,
        needsImage
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Invalid action. Use 'process_single', 'process_batch', or 'get_status'");
    }
  } catch (error) {
    console.error("generate-service-images error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
