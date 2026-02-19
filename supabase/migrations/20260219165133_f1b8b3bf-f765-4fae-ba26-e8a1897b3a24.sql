
-- Remove overly permissive SELECT policies that expose sensitive profile data to everyone
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles or their own" ON public.profiles;

-- The remaining owner-only SELECT policies are sufficient:
-- "Users can only see their own full profile" (uid = id)
-- "Users can only see their own private profile" (uid = id)
-- "Users can view own profile" (uid = id)
-- "Users can manage own profile" (ALL, uid = id)
-- "profiles_select_own_complete" (id = auth.uid())
-- 
-- All public data lookups should go through the public_profiles view,
-- which uses security_invoker and only exposes safe columns.
