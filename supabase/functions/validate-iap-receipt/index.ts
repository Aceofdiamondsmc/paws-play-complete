import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-IAP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { entitlements, original_app_user_id } = body;

    if (!entitlements) {
      throw new Error("Missing entitlements data");
    }

    const premiumEntitlement = entitlements['premium'];
    
    if (!premiumEntitlement) {
      logStep("No premium entitlement found, skipping sync");
      return new Response(JSON.stringify({ synced: false, reason: "no_entitlement" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Premium entitlement found", {
      periodType: premiumEntitlement.periodType,
      expirationDate: premiumEntitlement.expirationDate,
      productIdentifier: premiumEntitlement.productIdentifier,
    });

    // Determine status
    const isTrialing = premiumEntitlement.periodType === 'TRIAL';
    const status = isTrialing ? 'trialing' : 'active';

    // Upsert subscription record
    const { error: upsertError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: status,
        subscription_tier: 'starter',
        trial_end_date: isTrialing && premiumEntitlement.expirationDate
          ? premiumEntitlement.expirationDate
          : null,
        stripe_subscription_id: `iap_${original_app_user_id || user.id}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      logStep("Upsert error", { error: upsertError.message });
      // Try insert if upsert on user_id fails (conflict might be on stripe_subscription_id)
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: status,
          subscription_tier: 'starter',
          trial_end_date: isTrialing && premiumEntitlement.expirationDate
            ? premiumEntitlement.expirationDate
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (insertError) {
        logStep("Update also failed", { error: insertError.message });
        throw insertError;
      }
    }

    logStep("Subscription synced successfully", { status });

    return new Response(JSON.stringify({ synced: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
