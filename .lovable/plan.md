

## Fix: Message Send Error and Three-Dot Menu

### Issue 1: "null value in column 'url'" Error When Sending Messages

**Root Cause:** The `notify_new_message()` database trigger function tries to read `SUPABASE_URL` from `vault.decrypted_secrets`, but that secret doesn't exist in the vault. This makes the URL `NULL`, crashing the `net.http_post` call and preventing the message from being inserted.

**Fix:** Replace the trigger function with a version that hardcodes the Supabase URL and anon key, matching the pattern used by all other working notification triggers in the project.

**Database migration:**
```sql
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
```

---

### Issue 2: Three-Dot Menu Not Working

**Root Cause:** The `ChatView` uses a `fixed inset-0 z-[60]` container. The Radix dropdown portal renders at `document.body` level but without a high enough z-index to appear above the chat overlay. Additionally, Radix `DropdownMenuItem` uses `onSelect` for its action event, not `onClick`.

**Fix in `src/components/profile/ChatView.tsx`:**
- Add `className="z-[70]"` and `sideOffset={5}` to `DropdownMenuContent`
- Change `onClick` to `onSelect` on the `DropdownMenuItem`

---

### Summary of Changes

| Change | Target |
|--------|--------|
| Replace `notify_new_message()` function | SQL migration |
| Fix dropdown z-index and event handler | `src/components/profile/ChatView.tsx` |

