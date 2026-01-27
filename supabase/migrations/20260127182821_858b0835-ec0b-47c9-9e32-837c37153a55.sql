-- Add UPDATE policy for playdate_requests so receivers can accept/decline
CREATE POLICY "Receivers can update playdate status"
ON public.playdate_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = playdate_requests.receiver_dog_id 
    AND dogs.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = playdate_requests.receiver_dog_id 
    AND dogs.owner_id = auth.uid()
  )
);

-- Add DELETE policy for playdate_requests so requesters can cancel
CREATE POLICY "Requesters can delete own playdate requests"
ON public.playdate_requests
FOR DELETE
USING (requester_id = auth.uid());

-- Add INSERT policy for playdate_schedules
CREATE POLICY "Participants can insert schedules"
ON public.playdate_schedules
FOR INSERT
WITH CHECK (
  proposed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM playdate_requests pr
    WHERE pr.id = playdate_schedules.playdate_request_id
    AND (
      pr.requester_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dogs d
        WHERE d.id = pr.receiver_dog_id AND d.owner_id = auth.uid()
      )
    )
  )
);

-- Add SELECT policy for playdate_schedules
CREATE POLICY "Participants can view schedules"
ON public.playdate_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM playdate_requests pr
    WHERE pr.id = playdate_schedules.playdate_request_id
    AND (
      pr.requester_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dogs d
        WHERE d.id = pr.receiver_dog_id AND d.owner_id = auth.uid()
      )
    )
  )
);

-- Add UPDATE policy for playdate_schedules
CREATE POLICY "Participants can update schedules"
ON public.playdate_schedules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM playdate_requests pr
    WHERE pr.id = playdate_schedules.playdate_request_id
    AND (
      pr.requester_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dogs d
        WHERE d.id = pr.receiver_dog_id AND d.owner_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playdate_requests pr
    WHERE pr.id = playdate_schedules.playdate_request_id
    AND (
      pr.requester_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dogs d
        WHERE d.id = pr.receiver_dog_id AND d.owner_id = auth.uid()
      )
    )
  )
);

-- Enable RLS on playdate_schedules if not already enabled
ALTER TABLE public.playdate_schedules ENABLE ROW LEVEL SECURITY;