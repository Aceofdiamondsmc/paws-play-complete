-- Create service_submissions table for business listing requests
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
  stripe_customer_id text,
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

-- Policies: Users can view own submissions
CREATE POLICY "service_submissions_select_own"
  ON public.service_submissions FOR SELECT
  USING (submitter_id = auth.uid());

-- Policies: Users can insert own submissions
CREATE POLICY "service_submissions_insert_own"
  ON public.service_submissions FOR INSERT
  WITH CHECK (submitter_id = auth.uid());

-- Policies: Admins can manage all submissions
CREATE POLICY "service_submissions_admin_all"
  ON public.service_submissions FOR ALL
  USING (public.is_admin());

-- Create updated_at function
CREATE OR REPLACE FUNCTION public.update_submissions_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SET search_path = public;

-- Create updated_at trigger for service_submissions
CREATE TRIGGER update_service_submissions_updated_at
  BEFORE UPDATE ON public.service_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_submissions_updated_at();

-- Function to copy approved submission to services table
CREATE OR REPLACE FUNCTION public.copy_submission_to_services()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
        WHEN NEW.subscription_tier = 'premium' THEN 'Premium'
        WHEN NEW.subscription_tier = 'featured' THEN 'Featured'
        ELSE 'Standard'
      END,
      0,
      true,
      NEW.subscription_tier IN ('featured', 'premium')
    );
    
    -- Update the submission with approved timestamp
    NEW.approved_at := now();
  END IF;
  
  RETURN NEW;
END;
$fn$;

-- Create approval trigger
CREATE TRIGGER on_submission_approved
  BEFORE UPDATE ON public.service_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_submission_to_services();