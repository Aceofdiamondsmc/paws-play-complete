import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Pricing tiers for service listings
const PRICING = {
  starter: {
    priceId: "price_1T4vr4FJz7YiRCGBNOix6uLP",
    mode: "subscription" as const,
    name: "Starter Listing",
    price: 999, // $9.99/mo
  },
  basic: {
    priceId: "price_1SukqDFJz7YiRCGB6BloQ6Rx",
    mode: "payment" as const,
    name: "Value Listing",
    price: 2999, // $29.99
  },
  featured: {
    priceId: "price_1SuksMFJz7YiRCGBe1aUuX4O",
    mode: "subscription" as const,
    name: "Featured Listing",
    price: 1999, // $19.99/mo
  },
  premium: {
    priceId: "price_1SuktkFJz7YiRCGB27QB0NmD",
    mode: "subscription" as const,
    name: "Premium Listing",
    price: 14999, // $149.99/yr
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    logStep("Stripe key verified");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { submissionId, tier } = body;
    
    if (!submissionId) throw new Error("submissionId is required");
    if (!tier || !PRICING[tier as keyof typeof PRICING]) {
      throw new Error("Valid tier (basic, featured, premium) is required");
    }

    const tierConfig = PRICING[tier as keyof typeof PRICING];
    logStep("Tier selected", { tier, priceId: tierConfig.priceId, mode: tierConfig.mode });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Build success/cancel URLs
    const origin = req.headers.get("origin") || "https://pawsplayrepeat.lovable.app";
    const successUrl = `${origin}/submission-success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`;
    const cancelUrl = `${origin}/submit-service?canceled=true`;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: tierConfig.mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        submissionId,
        tier,
        userId: user.id,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update submission with session ID and set payment to pending
    const { error: updateError } = await supabaseClient
      .from("service_submissions")
      .update({
        stripe_session_id: session.id,
        stripe_customer_id: customerId || null,
        payment_status: "pending",
        subscription_tier: tier,
      })
      .eq("id", submissionId)
      .eq("submitter_id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update submission", { error: updateError.message });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
