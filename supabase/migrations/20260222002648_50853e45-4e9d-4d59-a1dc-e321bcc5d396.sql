-- Drop the broken trigger that calls send-test-notification with empty body
DROP TRIGGER IF EXISTS on_friend_request ON public.friendships;

-- Create new trigger that calls the dedicated friend-request-notification function
CREATE TRIGGER on_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/friend-request-notification',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );