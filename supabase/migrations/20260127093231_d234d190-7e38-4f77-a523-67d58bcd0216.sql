-- Add OneSignal player ID column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onesignal_player_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onesignal_player_id IS 'OneSignal Player ID for push notifications';