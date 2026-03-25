-- Add tos_accepted_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;

-- Create content_reports table
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own reports
CREATE POLICY "content_reports_insert_own" ON public.content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins can read all reports
CREATE POLICY "content_reports_select_admin" ON public.content_reports
  FOR SELECT TO authenticated
  USING (is_admin());

-- Users can see their own reports
CREATE POLICY "content_reports_select_own" ON public.content_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());