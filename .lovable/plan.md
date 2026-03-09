

## Add "Starter" Tier and Rename "Basic" to "Value"

### Overview
Add a new $9.99/month "Starter" tier (the lowest-priced option), rename "Basic" to "Value", and reorder all tiers from cheapest to most expensive.

### Stripe Setup (Done)
- Created Stripe product "Starter Listing" with price `price_1T4vr4FJz7YiRCGBNOix6uLP` ($9.99/month, recurring)

### Changes

**1. `src/pages/SubmitService.tsx`** -- Update `PRICING_TIERS` array

Reorder and update the tiers array to:
1. **Starter** -- $9.99/month (new) -- basic directory listing, searchable, contact info
2. **Value** -- $29.99 one-time (renamed from Basic) -- everything in Starter for a full year
3. **Featured** -- $19.99/month (unchanged) -- priority placement, badge
4. **Premium** -- $149.99/year (unchanged) -- top placement, verified

Also update `selectedTier` default from `'basic'` to `'starter'` and add a `Sparkles` icon import for the new tier.

**2. `supabase/functions/create-checkout-session/index.ts`** -- Add starter tier to PRICING map

Add `starter` entry with price ID `price_1T4vr4FJz7YiRCGBNOix6uLP`, mode `subscription`, and rename `basic` display name to "Value Listing".

**3. `src/hooks/useServiceSubmissions.tsx`** -- Update TypeScript types

Add `'starter'` to the `subscription_tier` union types in both `ServiceSubmission` and `SubmissionFormData` interfaces.

**4. Database migration** -- Update the `subscription_tier` column constraint

The `service_submissions` table likely has a check constraint limiting tier values to `basic`, `featured`, `premium`. Need to add `'starter'` as an allowed value.

### Tier Order (lowest to highest)

| Tier | Price | Billing |
|------|-------|---------|
| Starter | $9.99 | /month |
| Value | $29.99 | one-time |
| Featured | $19.99 | /month |
| Premium | $149.99 | /year |

