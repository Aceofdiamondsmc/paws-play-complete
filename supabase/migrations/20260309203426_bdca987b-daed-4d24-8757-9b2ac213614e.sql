
-- Create park_suggestions table
CREATE TABLE public.park_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  description text,
  latitude double precision,
  longitude double precision,
  image_url text,
  is_fully_fenced boolean DEFAULT false,
  has_water_station boolean DEFAULT false,
  has_small_dog_area boolean DEFAULT false,
  has_large_dog_area boolean DEFAULT false,
  has_agility_equipment boolean DEFAULT false,
  has_parking boolean DEFAULT false,
  has_grass_surface boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.park_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own suggestions
CREATE POLICY "park_suggestions_insert_own"
  ON public.park_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own suggestions
CREATE POLICY "park_suggestions_select_own"
  ON public.park_suggestions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all suggestions
CREATE POLICY "park_suggestions_select_admin"
  ON public.park_suggestions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update suggestions (approve/reject)
CREATE POLICY "park_suggestions_update_admin"
  ON public.park_suggestions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete suggestions
CREATE POLICY "park_suggestions_delete_admin"
  ON public.park_suggestions FOR DELETE
  TO authenticated
  USING (is_admin());
