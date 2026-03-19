
-- Create vet_visits table
CREATE TABLE public.vet_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  clinic_name text,
  visit_type text NOT NULL DEFAULT 'annual_checkup',
  vaccination_types text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vet_visits ENABLE ROW LEVEL SECURITY;

-- Users manage their own vet visits
CREATE POLICY "vet_visits_owner_all" ON public.vet_visits
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
