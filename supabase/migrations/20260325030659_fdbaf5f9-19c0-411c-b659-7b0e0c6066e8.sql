-- Fix app_settings.updated_by FK to allow user deletion
ALTER TABLE public.app_settings 
  DROP CONSTRAINT IF EXISTS app_settings_updated_by_fkey;
ALTER TABLE public.app_settings 
  ADD CONSTRAINT app_settings_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix service_submissions.approved_by FK to allow user deletion
ALTER TABLE public.service_submissions 
  DROP CONSTRAINT IF EXISTS service_submissions_approved_by_fkey;
ALTER TABLE public.service_submissions 
  ADD CONSTRAINT service_submissions_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;