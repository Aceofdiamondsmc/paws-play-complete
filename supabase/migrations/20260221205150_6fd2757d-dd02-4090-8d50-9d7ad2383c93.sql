
-- 1. Create user_blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own blocks
CREATE POLICY "Users can view own blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- RLS: Users can insert own blocks
CREATE POLICY "Users can insert own blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- RLS: Users can delete own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- 2. Security definer function to check if user A blocked user B
CREATE OR REPLACE FUNCTION public.check_user_blocked(p_requester uuid, p_receiver_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_receiver_owner AND blocked_id = p_requester)
       OR (blocker_id = p_requester AND blocked_id = p_receiver_owner)
  );
$$;

-- 3. Security definer function to block user and decline all pending requests
CREATE OR REPLACE FUNCTION public.block_user_and_decline_requests(p_blocker uuid, p_blocked uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert block record
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (p_blocker, p_blocked)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Decline all pending playdate requests from blocked user to blocker's dogs
  UPDATE public.playdate_requests
  SET status = 'declined', updated_at = now()
  WHERE requester_id = p_blocked
    AND status = 'pending'
    AND receiver_dog_id IN (
      SELECT id FROM public.dogs WHERE owner_id = p_blocker
    );
END;
$$;

-- 4. Update playdate_requests INSERT to block requests from blocked users
CREATE POLICY "Blocked users cannot send requests"
  ON public.playdate_requests FOR INSERT
  WITH CHECK (
    NOT public.check_user_blocked(
      auth.uid(),
      (SELECT owner_id FROM public.dogs WHERE id = receiver_dog_id)
    )
  );
