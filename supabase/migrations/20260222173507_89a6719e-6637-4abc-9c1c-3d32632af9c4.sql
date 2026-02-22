CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/message-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhc2Jna2dnd25rdnJjZXppYWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDU0NjYsImV4cCI6MjA4MzM4MTQ2Nn0.r3QfznSxZRokZHZAojxD4APUDE9q7pk3asR0V8e0rMg'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;