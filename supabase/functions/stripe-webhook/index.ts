import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Helper to upsert into the subscriptions table
async function upsertSubscription(
  supabase: any,
  subscription: Stripe.Subscription,
  userId: string | null,
  tier?: string | null,
) {
  if (!userId) {
    logStep("No userId available, skipping subscriptions upsert");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;

  const row = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    user_id: userId,
    status: subscription.status as string, // trialing, active, canceled, past_due, etc.
    price_id: priceId,
    subscription_tier: tier ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    trial_start_date: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end_date: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row as any, { onConflict: "stripe_subscription_id" });

  if (error) {
    logStep("Failed to upsert subscriptions row", { error: error.message });
  } else {
    logStep("Subscriptions row upserted", { stripe_subscription_id: subscription.id, status: row.status });
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature and body
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("Webhook signature verification failed", { error: message });
      return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase with service role for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          mode: session.mode,
          paymentStatus: session.payment_status 
        });

        const submissionId = session.metadata?.submissionId;
        const userId = session.metadata?.userId ?? null;
        const tier = session.metadata?.tier ?? session.metadata?.type ?? null;

        // --- Existing service_submissions logic (unchanged) ---
        if (submissionId) {
          const updateData: Record<string, unknown> = {
            payment_status: "paid",
            stripe_customer_id: session.customer as string,
          };

          if (session.mode === "subscription" && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            updateData.stripe_subscription_id = subscription.id;
            updateData.subscription_valid_until = new Date(subscription.current_period_end * 1000).toISOString();
          } else {
            const validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 1);
            updateData.subscription_valid_until = validUntil.toISOString();
          }

          const { error: updateError } = await supabase
            .from("service_submissions")
            .update(updateData)
            .eq("id", submissionId);

          if (updateError) {
            logStep("Failed to update submission", { error: updateError.message });
          } else {
            logStep("Submission updated successfully", { submissionId, ...updateData });
          }
        }

        // --- New: upsert subscriptions table ---
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(supabase, subscription, userId, tier);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Try to get userId from subscription metadata
        const userId = subscription.metadata?.userId ?? null;

        // If no userId in metadata, look it up from existing row
        let resolvedUserId = userId;
        if (!resolvedUserId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          resolvedUserId = existing?.user_id ?? null;
        }

        await upsertSubscription(supabase, subscription, resolvedUserId);
        break;
      }

      case "invoice.paid": {
        // Recurring subscription payment successful
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // --- Existing service_submissions logic (unchanged) ---
          const { error } = await supabase
            .from("service_submissions")
            .update({
              payment_status: "paid",
              subscription_valid_until: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription);

          if (error) {
            logStep("Failed to update subscription validity", { error: error.message });
          } else {
            logStep("Subscription validity extended");
          }

          // --- New: update subscriptions table ---
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();

          if (existing?.user_id) {
            await upsertSubscription(supabase, subscription, existing.user_id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription canceled
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // --- Existing service_submissions logic (unchanged) ---
        const { error } = await supabase
          .from("service_submissions")
          .update({ payment_status: "refunded" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Failed to mark subscription as canceled", { error: error.message });
        }

        // --- New: update subscriptions table ---
        const { error: subError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);

        if (subError) {
          logStep("Failed to update subscriptions status to canceled", { error: subError.message });
        } else {
          logStep("Subscriptions row marked as canceled");
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const submissionId = session.metadata?.submissionId;
        
        if (submissionId) {
          const { error } = await supabase
            .from("service_submissions")
            .update({ payment_status: "failed" })
            .eq("id", submissionId);

          if (error) {
            logStep("Failed to mark session as failed", { error: error.message });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
