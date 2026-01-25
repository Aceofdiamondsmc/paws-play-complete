
-- Fix Security Definer Views by adding security_invoker = on
-- This ensures views use the querying user's permissions, not the view creator's

-- Recreate posts_public view with security_invoker
DROP VIEW IF EXISTS public.posts_public;
CREATE VIEW public.posts_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  created_at,
  content,
  'masked_user'::text AS author_display_id,
  (substring((author_id)::text, 1, 8) || '...') AS author_short_id
FROM posts
WHERE visibility = 'public';

-- Recreate products_public view with security_invoker
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  description,
  price
FROM products;

-- Recreate public_profiles view with security_invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = on)
AS
SELECT 
  id,
  username,
  avatar_url,
  bio
FROM profiles
WHERE is_public = true;

-- Recreate services_explore view with security_invoker
DROP VIEW IF EXISTS public.services_explore;
CREATE VIEW public.services_explore 
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  category,
  description,
  enriched_description,
  is_verified,
  latitude,
  longitude,
  verified_latitude,
  verified_longitude
FROM services
WHERE (is_flagged = false) OR (is_flagged IS NULL);
