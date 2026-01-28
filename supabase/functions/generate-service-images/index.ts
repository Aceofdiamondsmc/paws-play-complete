import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  'Dog Walkers': 'Professional photo of a friendly person walking multiple happy dogs on leashes in a sunny park, warm natural lighting, authentic candid style, high quality, 4k',
  'Groomers': 'Professional pet grooming salon interior, clean and modern, showing a well-groomed fluffy dog on grooming table, spa-like atmosphere, high quality, 4k',
  'Vet Clinics': 'Modern veterinary clinic reception area, warm and welcoming, with a friendly veterinarian in scrubs petting a calm dog, professional medical setting, high quality, 4k',
  'Trainers': 'Outdoor dog training session, professional trainer working with an attentive dog, positive reinforcement training, natural park setting, high quality, 4k',
  'Daycare': 'Bright colorful dog daycare facility with multiple happy dogs playing together, indoor play area, joyful atmosphere, high quality, 4k',
};

const DEFAULT_PROMPT = 'Professional photo of a happy dog at a pet care facility, warm lighting, high quality, 4k';

interface Service {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
}

async function generateImageForService(
  supabase: any,
  service: Service,
  lovableApiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prompt = CATEGORY_PROMPTS[service.category] || DEFAULT_PROMPT;
    const uniquePrompt = `${prompt}. This is for "${service.name}", a ${service.category.toLowerCase()} business.`;

    console.log(`Generating image for service ${service.id}: ${service.name}`);

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

    // Upload to Supabase Storage
    const fileName = `service-${service.id}-${Date.now()}.png`;
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

    console.log(`Successfully generated image for service ${service.id}: ${publicUrl}`);
    return { success: true };
  } catch (error) {
    console.error(`Error processing service ${service.id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if an image URL is likely broken
function isLikelyBrokenUrl(url: string | null): boolean {
  if (!url) return true;
  
  // Known broken domain patterns
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, serviceId, limit = 5 } = await req.json();

    if (action === "process_single" && serviceId) {
      // Process a single service
      const { data: service, error } = await supabase
        .from('services')
        .select('id, name, category, image_url')
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
      // Fetch services that need images
      const { data: services, error } = await supabase
        .from('services')
        .select('id, name, category, image_url')
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
