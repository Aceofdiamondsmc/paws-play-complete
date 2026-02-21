
-- Allow users to send friend requests
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid() AND requester_id != addressee_id);

-- Allow addressee to accept/decline
CREATE POLICY "Users can respond to friend requests"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (addressee_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid());

-- Allow either party to remove friendship
CREATE POLICY "Users can remove friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
