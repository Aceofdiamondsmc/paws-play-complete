
-- Lost Dog Alerts table
CREATE TABLE public.lost_dog_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dog_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  description text,
  last_seen_location text,
  last_seen_lat double precision,
  last_seen_lng double precision,
  contact_phone text,
  post_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.lost_dog_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lost_dog_alerts_owner_manage" ON public.lost_dog_alerts
FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "lost_dog_alerts_read_active" ON public.lost_dog_alerts
FOR SELECT TO authenticated
USING (status = 'active');

-- Group Playdates table
CREATE TABLE public.group_playdates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location_name text NOT NULL,
  location_lat double precision,
  location_lng double precision,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  max_dogs integer DEFAULT 10,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_playdates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_playdates_read" ON public.group_playdates
FOR SELECT TO authenticated USING (true);

CREATE POLICY "group_playdates_organizer_insert" ON public.group_playdates
FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "group_playdates_organizer_update" ON public.group_playdates
FOR UPDATE TO authenticated
USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "group_playdates_organizer_delete" ON public.group_playdates
FOR DELETE TO authenticated USING (organizer_id = auth.uid());

-- Group Playdate RSVPs table
CREATE TABLE public.group_playdate_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_playdate_id uuid NOT NULL REFERENCES public.group_playdates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dog_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_playdate_id, dog_id)
);

ALTER TABLE public.group_playdate_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvps_read" ON public.group_playdate_rsvps
FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsvps_own_insert" ON public.group_playdate_rsvps
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "rsvps_own_update" ON public.group_playdate_rsvps
FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "rsvps_own_delete" ON public.group_playdate_rsvps
FOR DELETE TO authenticated USING (user_id = auth.uid());
