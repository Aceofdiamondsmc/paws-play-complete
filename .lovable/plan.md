

## Fix: Remove Database Triggers Calling Non-Existent `realtime.send()`

### Root Cause

The error **"function realtime.send(text, text, jsonb, boolean) does not exist"** is NOT coming from the app code -- it's coming from **two database triggers** on the `messages` table:

1. `messages_broadcast_trg`
2. `messages_broadcast_trigger`

Both triggers execute a function called `messages_broadcast_trigger()` which calls `realtime.send(...)`. This function does not exist in your Supabase instance, so every `INSERT` into `messages` fails.

The app code is correct -- it only uses `supabase.from('messages').insert()`. But the database itself is blocking the insert.

### Solution

Run a SQL migration to:
1. Drop both triggers from the `messages` table
2. Drop the `messages_broadcast_trigger()` function

The app already has `postgres_changes` Realtime subscriptions that will handle UI updates automatically -- these custom triggers are unnecessary.

### Technical Details

**SQL Migration:**

```sql
-- Drop the duplicate triggers that call the non-existent realtime.send()
DROP TRIGGER IF EXISTS messages_broadcast_trg ON public.messages;
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON public.messages;

-- Drop the trigger function itself
DROP FUNCTION IF EXISTS public.messages_broadcast_trigger();
```

**Files Modified:** None -- this is a database-only change.

**What happens after:**
- Message inserts will succeed because no trigger will try to call `realtime.send()`
- The existing `postgres_changes` Realtime subscriptions in `useMessages.tsx` will continue to detect new messages and update the UI automatically
- No app code changes are needed

