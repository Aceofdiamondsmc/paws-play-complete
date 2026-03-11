

## Update stripe-webhook to Save to `subscriptions` Table

The current webhook only writes to `service_submissions`. Your `subscriptions` table has the right schema (`status`, `trial_end_date`, `trial_start_date`, `stripe_subscription_id`, `stripe_customer_id`, `user_id`, `price_id`, `subscription_tier`, `cancel_at_period_end`). The webhook needs to upsert into this table for all subscription-related events.

### Changes

**`supabase/functions/stripe-webhook/index.ts`**

Add logic to upsert the `subscriptions` table alongside the existing `service_submissions` updates:

1. **`checkout.session.completed`** -- When the session has a subscription, retrieve it from Stripe and upsert into `subscriptions`:
   - `user_id` from `session.metadata.userId`
   - `stripe_subscription_id`, `stripe_customer_id`
   - `status`: map from Stripe status (`trialing`, `active`, etc.)
   - `trial_end_date` / `trial_start_date`: from `subscription.trial_end` / `subscription.trial_start` (convert epoch to ISO)
   - `price_id`: from `subscription.items.data[0].price.id`
   - `subscription_tier`: from `session.metadata.tier` or `type`
   - `cancel_at_period_end`: from `subscription.cancel_at_period_end`
   - Upsert on `stripe_subscription_id` conflict

2. **`customer.subscription.updated`** (new event) -- Handle trial-to-active transitions, cancellation toggles:
   - Upsert with updated `status`, `trial_end_date`, `cancel_at_period_end`

3. **`invoice.paid`** -- After existing `service_submissions` update, also update `subscriptions` status to `active` and clear trial fields if applicable

4. **`customer.subscription.deleted`** -- Update `subscriptions` row status to `canceled`

The existing `service_submissions` logic remains unchanged. The `subscriptions` upsert is additive -- if no `userId` is in metadata (e.g., old service listing checkouts), the subscriptions upsert is skipped.

### Key Detail

The upsert uses `.upsert()` with `onConflict: 'stripe_subscription_id'` so repeated webhook deliveries are idempotent. The `subscription_status` enum already supports: `trialing`, `active`, `canceled`, `past_due`, `none`.

