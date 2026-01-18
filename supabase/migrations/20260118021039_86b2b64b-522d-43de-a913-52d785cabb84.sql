-- =====================================================
-- FIX 1: Protect FCM tokens in profiles table
-- Create a safe public view that excludes fcm_token
-- =====================================================

-- Create a safe public view for profiles that excludes sensitive fields like fcm_token
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  display_name,
  full_name,
  avatar_url,
  bio,
  city,
  state,
  is_public,
  created_at,
  updated_at,
  onboarding_completed
FROM public.profiles
WHERE is_public = true OR id = auth.uid();

-- Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "profiles_select_public_or_owner" ON public.profiles;

-- Create new restrictive policies:
-- 1. Users can ONLY see their own complete profile (including fcm_token)
CREATE POLICY "profiles_select_own_complete"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- FIX 2: Enable RLS on oauth_authorizations table
-- =====================================================

-- Enable RLS on oauth_authorizations table
ALTER TABLE public.oauth_authorizations ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own OAuth authorizations
CREATE POLICY "oauth_authorizations_select_own"
ON public.oauth_authorizations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own OAuth authorizations
CREATE POLICY "oauth_authorizations_insert_own"
ON public.oauth_authorizations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own OAuth authorizations
CREATE POLICY "oauth_authorizations_delete_own"
ON public.oauth_authorizations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own OAuth authorizations
CREATE POLICY "oauth_authorizations_update_own"
ON public.oauth_authorizations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());