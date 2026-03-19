import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_MESSAGES = 10;
const MAX_CHAR_LENGTH = 500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - require valid user
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

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedMessages = messages
      .filter((msg: any) => ['user', 'assistant'].includes(msg.role))
      .slice(-MAX_MESSAGES)
      .map((msg: any) => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.slice(0, MAX_CHAR_LENGTH) : '',
      }));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch services from database for context using service role
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, category, rating, price, enriched_description, phone, website, is_verified')
      .order('rating', { ascending: false })
      .limit(50);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    }

    // Build context about available services
    const servicesContext = services?.map(s => 
      `- ${s.name} (${s.category}): ${s.price} price tier, ${s.rating} stars${s.is_verified ? ', Verified' : ''}${s.enriched_description ? `. ${s.enriched_description}` : ''}`
    ).join('\n') || 'No services available';

    const systemPrompt = `You are a friendly, helpful pet services assistant for Paws Play Repeat app. Help users find the perfect pet service based on their needs.

AVAILABLE SERVICES:
${servicesContext}

GUIDELINES:
- Be warm, friendly, and use dog-themed language occasionally (like "paw-some", "fur-tastic")
- When recommending services, mention the name, category, price tier, and rating
- Ask clarifying questions if needed (what type of service, budget, location preferences)
- Keep responses concise but helpful
- If a user asks about a specific category, focus on those services
- Price tiers: $ = budget-friendly, $$ = moderate, $$$ = premium, $$$$ = luxury
- Always mention if a service is verified (it means higher trust)
- If no services match, suggest they check back soon or try a different category`;

    console.log('Calling Lovable AI with context for', services?.length || 0, 'services');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("explore-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
