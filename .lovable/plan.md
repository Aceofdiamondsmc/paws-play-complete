

## Complete Care Reminder Background Push Setup

The edge function (`care-reminder-push`) and config are already deployed. Two database steps remain to activate the system.

### Step 1: Create Deduplication Table

Create `care_reminder_sent_log` to prevent duplicate push notifications:

```sql
CREATE TABLE public.care_reminder_sent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL,
  sent_date date NOT NULL DEFAULT CURRENT_DATE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reminder_id, sent_date)
);

ALTER TABLE public.care_reminder_sent_log ENABLE ROW LEVEL SECURITY;
```

### Step 2: Set Up Cron Job

Enable `pg_cron` and `pg_net` extensions, then schedule the edge function to run every minute:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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
```

### Step 3: Daily Cleanup Cron (optional but recommended)

Purge old sent-log rows to keep the table small:

```sql
SELECT cron.schedule(
  'cleanup-care-reminder-sent-log',
  '0 3 * * *',
  $$DELETE FROM public.care_reminder_sent_log WHERE sent_date < CURRENT_DATE - INTERVAL '2 days';$$
);
```

### What This Completes

- The edge function runs every minute via `pg_cron`
- It checks which reminders match the current HH:MM
- Sends OneSignal push notifications even when the app is closed
- Deduplication table prevents repeat pushes for the same reminder on the same day
- Old log entries are cleaned up daily

### Technical Note

The cron job SQL contains project-specific credentials (anon key), so it will be executed via the SQL insert tool rather than a migration file -- this keeps secrets out of version control.

