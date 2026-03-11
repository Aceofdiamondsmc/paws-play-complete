

## Add "Manage Subscription" Button

Add a "Manage Subscription" button to the `FreeTrialBanner` for both active subscribers and trialing users. This opens the Stripe Customer Portal (already implemented as `customer-portal` edge function) where users can cancel, upgrade, or change payment methods.

### Changes

**`src/components/explore/FreeTrialBanner.tsx`**

1. Add a `manageSubscription` helper that invokes `customer-portal` and opens the returned URL in a new tab.
2. Add loading state (`isManaging`) for the button.
3. In the **active subscription** card (lines 60-76): add a "Manage Subscription" button below the status text.
4. In the **active trial** card (lines 80-98): add a "Manage Subscription" button below the trial status text.

Both buttons will be styled as `variant="outline"` with a `Settings` icon, compact size, keeping the cards clean but giving users full transparency and control.

**`src/hooks/useSubscription.tsx`**

Add a `manageSubscription` function that calls `supabase.functions.invoke('customer-portal')` and opens the portal URL. Export it from the hook so it's reusable.

### Why the banner is the right place

The banner is always visible on the Services/Explore tab — users see their subscription status there already, so adding management inline keeps the flow natural and transparent without burying it in a settings page.

