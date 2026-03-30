

## Plan: Connect IAP Subscription to Service Submission Flow

### What changes

When a user has an active IAP subscription (trial or paid), they can submit a service listing directly — skipping the tier selection and Stripe checkout entirely. Their listing is auto-tagged as "starter" tier (included with their subscription).

### Changes

**1. `src/pages/SubmitService.tsx`**
- Import `useSubscription` hook
- Detect if user `isSubscribed` (trial or paid)
- If subscribed: hide the tier selection card and change "Continue to Checkout" to "Submit Listing"
- If subscribed: skip Step 2 entirely — after form submission, auto-set `payment_status` to `'paid'` on the submission and navigate directly to a success page
- If not subscribed: keep existing Stripe checkout flow (web users)

**2. `src/hooks/useServiceSubmissions.tsx`**
- Add a new mutation `useCreatePaidSubmission` (or modify `useCreateSubmission`) that accepts an optional `skipPayment` flag
- When `skipPayment` is true, insert the submission with `payment_status: 'paid'` and `subscription_tier: 'starter'` so it goes straight to the admin approval queue without needing Stripe

**3. `src/components/services/FreeTrialBanner.tsx`**
- For subscribed users (both trial and paid states): add a "Submit Your Business" button that navigates to `/submit-service`
- This replaces just showing "Manage Subscription" — now shows both the manage button and the submit button

**4. `src/pages/SubmissionSuccess.tsx`**
- Minor: adjust copy so it doesn't always say "Payment Successful!" — for IAP subscribers it should say "Submission Received!" instead

### Flow summary

```text
Subscribed user (iOS IAP):
  Services tab → FreeTrialBanner shows "Submit Your Business" button
  → /submit-service → Fill form (no tier picker, no checkout)
  → Insert with payment_status='paid' → Navigate to success page
  → Admin reviews and approves

Non-subscribed user (web):
  Services tab → FreeTrialBanner shows "Start Free Trial"
  → /submit-service → Fill form + pick tier → Stripe checkout
  → (unchanged existing flow)
```

### Technical details

- `useSubscription().isSubscribed` already returns `true` for both trial and paid states — this is what gates the flow
- The submission row gets `payment_status: 'paid'` immediately since the user already paid via IAP
- No database migration needed — the existing `service_submissions` table already supports `payment_status: 'paid'` and `subscription_tier: 'starter'`
- This requires a new iOS build to take effect on device

