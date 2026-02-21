CREATE TABLE public.care_reminder_sent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL,
  sent_date date NOT NULL DEFAULT CURRENT_DATE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reminder_id, sent_date)
);

ALTER TABLE public.care_reminder_sent_log ENABLE ROW LEVEL SECURITY;

-- Allow the edge function (service role) to read/write this table
CREATE POLICY "Service role full access" ON public.care_reminder_sent_log
  FOR ALL USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule care-reminder-push every minute
SELECT cron.schedule(
  'care-reminder-push-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/care-reminder-push',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhc2Jna2dnd25rdnJjZXppYWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDU0NjYsImV4cCI6MjA4MzM4MTQ2Nn0.r3QfznSxZRokZHZAojxD4APUDE9q7pk3asR0V8e0rMg"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Daily cleanup of old sent logs at 3 AM
SELECT cron.schedule(
  'cleanup-care-reminder-sent-log',
  '0 3 * * *',
  $$DELETE FROM public.care_reminder_sent_log WHERE sent_date < CURRENT_DATE - INTERVAL '2 days';$$
);