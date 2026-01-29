
# Plan: Add Your Service - Paid Business Listing Portal

## Overview
Implement a complete self-service portal where business owners can submit their pet service listings for a fee. The system includes Stripe payment integration, a submissions database, and an admin approval workflow that automatically transfers approved submissions to the main services directory.

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐      ┌────────────────────┐      ┌──────────────────────┐ │
│  │ Explore Tab  │ ──▶  │ /submit-service    │ ──▶  │ Stripe Checkout      │ │
│  │ "List Your   │      │ Business Info Form │      │ (One-time or Sub)    │ │
│  │  Business"   │      │ + Tier Selection   │      │                      │ │
│  └──────────────┘      └────────────────────┘      └──────────────────────┘ │
│                                                              │               │
│                                                              ▼               │
│                                                    ┌──────────────────────┐ │
│                                                    │ Webhook: Update      │ │
│                                                    │ payment_status       │ │
│                                                    └──────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐      ┌───────────────────┐      ┌───────────────┐ │
│  │ Admin Dashboard      │ ──▶  │ Click "Approve"   │ ──▶  │ Postgres      │ │
│  │ Pending Submissions  │      │ Button            │      │ trigger runs  │ │
│  │ (filtered by paid)   │      │                   │      │ copy_to_      │ │
│  │                      │      │                   │      │ services()    │ │
│  └──────────────────────┘      └───────────────────┘      └───────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Enable Stripe Integration

**Action Required:** Use Lovable's built-in Stripe enablement tool to:
1. Collect your Stripe Secret Key
2. Configure the STRIPE_SECRET_KEY in Supabase secrets
3. Unlock Stripe-specific tooling and context

This must happen first before any code changes.

---

## Phase 2: Database Schema

### New Table: `service_submissions`

```sql
CREATE TABLE public.service_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name text NOT NULL,
  category text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  phone text,
  website text,
  email text NOT NULL,
  
  -- Location (optional, for map placement)
  latitude double precision,
  longitude double precision,
  
  -- Media
  image_url text,
  
  -- Submitter Info
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_name text NOT NULL,
  
  -- Payment & Subscription
  payment_status text NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  stripe_session_id text,
  stripe_subscription_id text,
  subscription_tier text DEFAULT 'basic'
    CHECK (subscription_tier IN ('basic', 'featured', 'premium')),
  subscription_valid_until timestamp with time zone,
  
  -- Approval Workflow
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  
  -- Audit
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own submissions"
  ON public.service_submissions FOR SELECT
  USING (submitter_id = auth.uid());

CREATE POLICY "Users can insert own submissions"
  ON public.service_submissions FOR INSERT
  WITH CHECK (submitter_id = auth.uid());

CREATE POLICY "Admins can manage all submissions"
  ON public.service_submissions FOR ALL
  USING (public.is_admin());
```

### New Table: `service_subscriptions` (for recurring tracking)

```sql
CREATE TABLE public.service_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_submission_id uuid REFERENCES service_submissions(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'paused')),
  tier text NOT NULL DEFAULT 'basic',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.service_subscriptions ENABLE ROW LEVEL SECURITY;
```

### Approval Trigger: Auto-Copy to Services

```sql
-- Function to copy approved submission to services table
CREATE OR REPLACE FUNCTION public.copy_submission_to_services()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if approval_status changed to 'approved' and payment is 'paid'
  IF NEW.approval_status = 'approved' 
     AND OLD.approval_status != 'approved'
     AND NEW.payment_status = 'paid' THEN
    
    INSERT INTO public.services (
      name,
      category,
      description,
      latitude,
      longitude,
      phone,
      website,
      image_url,
      price,
      rating,
      is_verified,
      is_featured
    ) VALUES (
      NEW.business_name,
      NEW.category,
      NEW.description,
      NEW.latitude,
      NEW.longitude,
      NEW.phone,
      NEW.website,
      COALESCE(NEW.image_url, ''),
      CASE 
        WHEN NEW.subscription_tier = 'premium' THEN '$$$'
        WHEN NEW.subscription_tier = 'featured' THEN '$$'
        ELSE '$'
      END,
      0, -- Default rating
      true, -- Mark as verified since admin approved
      NEW.subscription_tier IN ('featured', 'premium') -- Featured if higher tier
    );
    
    -- Update the submission with approved timestamp
    NEW.approved_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_submission_approved
  BEFORE UPDATE ON public.service_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_submission_to_services();
```

---

## Phase 3: Edge Functions

### 1. `create-checkout-session`

Creates a Stripe Checkout session for business listing payments.

```typescript
// supabase/functions/create-checkout-session/index.ts
// Handles:
// - One-time "Basic" listing fee ($29.99)
// - Monthly "Featured" subscription ($19.99/mo)
// - Annual "Premium" subscription ($149.99/yr)
// Returns: { url: string } for redirect to Stripe
```

### 2. `stripe-webhook`

Processes Stripe webhook events:
- `checkout.session.completed` → Set payment_status = 'paid'
- `invoice.paid` → Extend subscription_valid_until
- `customer.subscription.deleted` → Mark subscription as canceled

```typescript
// supabase/functions/stripe-webhook/index.ts
// Configured with verify_jwt = false (public webhook)
// Validates Stripe signature using STRIPE_WEBHOOK_SECRET
```

---

## Phase 4: Frontend Components

### 1. CTA Card on Explore Tab

**File:** `src/components/explore/AddServiceCTA.tsx`

```tsx
// Premium-styled card at bottom of Explore page
// "Own a Pet Business? Get Listed!"
// - Brief value proposition
// - "Add Your Service" button → navigates to /submit-service
// - Visible to all users (authenticated or not)
```

### 2. Service Submission Page

**File:** `src/pages/SubmitService.tsx`

Multi-step form matching the app's premium aesthetic:

**Step 1 - Business Details:**
- Business Name (required)
- Category dropdown (Dog Walkers, Groomers, Vet Clinics, etc.)
- Address, City, State (required)
- Phone, Website, Email (required)
- Description (optional)

**Step 2 - Choose Your Plan:**
| Tier | Price | Features |
|------|-------|----------|
| Basic | $29.99 one-time | Standard listing for 1 year |
| Featured | $19.99/mo | Featured badge, priority placement |
| Premium | $149.99/yr | Featured + verified badge, top of search |

**Step 3 - Checkout:**
- Summary of submission
- Redirect to Stripe Checkout
- Return to confirmation page

### 3. Submission Confirmation Page

**File:** `src/pages/SubmissionSuccess.tsx`

- Thank you message
- "Your listing is pending review"
- Timeline expectations (24-48 hours)
- Link back to Explore

---

## Phase 5: Admin Dashboard Updates

**File:** `src/pages/admin/AdminServices.tsx`

Add new section: "Pending Submissions"

**Features:**
- Tab/section to toggle between "All Services" and "Pending Submissions"
- Filter by payment_status (show only 'paid' by default)
- Display submission details in expandable cards
- Action buttons:
  - **Approve** → Sets approval_status = 'approved' → Trigger copies to services
  - **Reject** → Opens modal for rejection reason → Sets approval_status = 'rejected'
- Badge indicators for payment_status and subscription_tier

**UI Example:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Pending Submissions (3 paid, awaiting approval)                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏪 Happy Paws Grooming                          [Featured]  │ │
│ │ Category: Groomers | City: Boston, MA                       │ │
│ │ Submitted: Jan 28, 2026 | Payment: ✅ Paid                  │ │
│ │                                                             │ │
│ │ [View Details]     [✓ Approve]     [✗ Reject]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/explore/AddServiceCTA.tsx` | Create | CTA card for Explore tab |
| `src/pages/SubmitService.tsx` | Create | Multi-step submission form |
| `src/pages/SubmissionSuccess.tsx` | Create | Post-checkout confirmation |
| `src/hooks/useServiceSubmissions.tsx` | Create | Hook for submission CRUD |
| `src/pages/Explore.tsx` | Modify | Add CTA component |
| `src/pages/admin/AdminServices.tsx` | Modify | Add submissions queue |
| `src/App.tsx` | Modify | Add new routes |
| `supabase/functions/create-checkout-session/` | Create | Stripe checkout |
| `supabase/functions/stripe-webhook/` | Create | Webhook handler |
| `supabase/config.toml` | Modify | Register new functions |

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe API access (added via Stripe enablement) |
| `STRIPE_WEBHOOK_SECRET` | Validate webhook signatures |
| `STRIPE_PRICE_BASIC` | Price ID for basic listing |
| `STRIPE_PRICE_FEATURED` | Price ID for featured monthly |
| `STRIPE_PRICE_PREMIUM` | Price ID for premium annual |

---

## Pricing Tiers (Suggested)

| Tier | Type | Price | Features |
|------|------|-------|----------|
| **Basic** | One-time | $29.99 | Listed for 1 year, standard placement |
| **Featured** | Monthly | $19.99/mo | "Featured" badge, higher in search |
| **Premium** | Annual | $149.99/yr | Verified badge, top placement, featured |

---

## Implementation Order

1. **Enable Stripe** (required first)
2. **Database migrations** (tables + trigger)
3. **Edge functions** (checkout + webhook)
4. **Frontend form** (SubmitService page)
5. **Explore CTA** (AddServiceCTA component)
6. **Admin queue** (update AdminServices)
7. **Test end-to-end**

---

## Security Considerations

1. **RLS Policies**: Users can only see their own submissions; admins see all
2. **Webhook Validation**: Stripe signatures verified before processing
3. **Payment Gate**: Admin approve button only visible for paid submissions
4. **No Direct Insertion**: Submissions must go through approval flow

---

## Next Steps

To proceed, I need to:
1. **Enable Stripe integration** using the Stripe enablement tool
2. Once enabled, create the database migrations
3. Build the edge functions for checkout and webhooks
4. Create the frontend components

Should I enable Stripe now to begin implementation?
