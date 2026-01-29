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
        if (!submissionId) {
          logStep("No submissionId in metadata, skipping");
          break;
        }

        // Update submission payment status
        const updateData: Record<string, unknown> = {
          payment_status: "paid",
          stripe_customer_id: session.customer as string,
        };

        // For subscriptions, add subscription ID and valid until date
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          updateData.stripe_subscription_id = subscription.id;
          updateData.subscription_valid_until = new Date(subscription.current_period_end * 1000).toISOString();
        } else {
          // One-time payment: valid for 1 year
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
        break;
      }

      case "invoice.paid": {
        // Recurring subscription payment successful
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
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
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription canceled
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { error } = await supabase
          .from("service_submissions")
          .update({ payment_status: "refunded" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Failed to mark subscription as canceled", { error: error.message });
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
