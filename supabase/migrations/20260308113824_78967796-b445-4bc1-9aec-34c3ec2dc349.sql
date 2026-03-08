CREATE POLICY "Requesters can update own requests"
ON public.playdate_requests
FOR UPDATE
USING (requester_id = auth.uid())
WITH CHECK (requester_id = auth.uid());