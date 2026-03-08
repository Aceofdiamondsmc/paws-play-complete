CREATE POLICY "Receivers can delete playdate requests"
ON public.playdate_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dogs
    WHERE dogs.id = playdate_requests.receiver_dog_id
    AND dogs.owner_id = auth.uid()
  )
);