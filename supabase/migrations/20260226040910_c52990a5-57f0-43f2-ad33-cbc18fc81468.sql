-- Drop existing check constraint on subscription_tier if it exists, then re-add with 'starter'
DO $$
BEGIN
  -- Try to drop the constraint (it may not exist or have a different name)
  BEGIN
    ALTER TABLE public.service_submissions DROP CONSTRAINT IF EXISTS service_submissions_subscription_tier_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Add updated check constraint that includes 'starter'
ALTER TABLE public.service_submissions
  ADD CONSTRAINT service_submissions_subscription_tier_check
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('starter', 'basic', 'featured', 'premium'));