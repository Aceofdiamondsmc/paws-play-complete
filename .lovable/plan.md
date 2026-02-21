

## Fix Background Push Notifications for Real Events

### Current Problem

Test pushes from Admin Tools work in the background because they call the `send-test-notification` edge function directly from the browser (via `supabase.functions.invoke()`). However, **real event notifications (comments) are failing** because:

1. The database trigger (`notify_on_comment`) calls the edge function via `pg_net`, and the OneSignal API **rejected the API key** with "Access denied" -- visible in the `net._http_response` table from Feb 18.
2. There is **no like notification** edge function at all -- only comments trigger push notifications.

### Root Cause

The `pg_net` HTTP call from the database trigger does **not include the Supabase `apikey` header**, but since `verify_jwt = false`, the edge function still processes the request. The edge function itself works -- the failure is at the OneSignal API level, where the `ONESIGNAL_REST_API_KEY` was invalid at the time of the last comment (Feb 18).

Since test pushes currently work, the key is now valid. The comment notification should work on the next comment. However, we should also add **like notifications** to match user expectations.

### Plan

#### 1. Create a `like-notification` Edge Function

**New file: `supabase/functions/like-notification/index.ts`**

- Triggered by a database webhook (same pattern as `comment-notification`)
- Receives the new `post_likes` record
- Looks up the post owner, skips self-likes
- Sends push notification via OneSignal: "Username liked your post!"
- Creates an in-app notification record in the `notifications` table

#### 2. Create Database Trigger for Likes

**Database migration:**

```sql
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/like-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'post_likes',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_inserted
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();
```

#### 3. Add Config for the New Function

**File: `supabase/config.toml`**

Add:
```toml
[functions.like-notification]
verify_jwt = false
```

#### 4. Verify Comment Notifications Still Work

After deploying, we should test by adding a comment on another user's post to confirm the OneSignal key now works for webhook-triggered notifications.

### Summary of Changes

| Change | Details |
|--------|---------|
| New edge function | `supabase/functions/like-notification/index.ts` |
| Database migration | Add `notify_on_like` trigger on `post_likes` |
| Config update | `supabase/config.toml` -- add like-notification entry |
| Testing | Verify both comment and like notifications fire in background |
