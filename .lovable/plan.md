

# Push Notifications for Comments - Implementation Plan

## Overview

This plan implements push notifications when users receive comments on their posts. It involves:
1. Adding OneSignal REST API key as a secret
2. Creating a new Edge Function to send notifications
3. Setting up a database webhook to trigger notifications on new comments
4. Optionally adding `OneSignal.login()` on auth state change for automatic identity linking

---

## Architecture

```text
┌─────────────────┐     INSERT      ┌──────────────────┐
│  post_comments  │ ──────────────> │ Database Webhook │
│     table       │                 │   (on INSERT)    │
└─────────────────┘                 └────────┬─────────┘
                                             │
                                             ▼
                                ┌────────────────────────┐
                                │   comment-notification │
                                │    Edge Function       │
                                └────────────┬───────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                          ▼                                     ▼
               ┌──────────────────┐                 ┌──────────────────┐
               │ OneSignal API    │                 │ notifications    │
               │ (push to device) │                 │ table (in-app)   │
               └──────────────────┘                 └──────────────────┘
```

---

## Step 1: Add OneSignal REST API Key Secret

A new secret `ONESIGNAL_REST_API_KEY` must be added to Supabase Edge Function secrets. This key is available from the OneSignal Dashboard under **Settings → Keys & IDs**.

The OneSignal App ID is already configured in `index.html`:
- App ID: `47e18c4a-2002-4fec-9e3a-4984745e7cd5`

---

## Step 2: Create Edge Function - `comment-notification`

**File: `supabase/functions/comment-notification/index.ts`**

This Edge Function will:
1. Receive webhook payload with the new comment data
2. Look up the post to find the `author_id` (post owner)
3. Look up the commenter's profile for display name
4. Skip notification if commenter is the post owner (don't notify yourself)
5. Look up post owner's `onesignal_player_id` from profiles
6. Send push notification via OneSignal REST API
7. Insert record into `notifications` table for in-app display

```typescript
// Key implementation details:

// 1. CORS headers for webhook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2. Supabase client with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 3. OneSignal API call
const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
  },
  body: JSON.stringify({
    app_id: '47e18c4a-2002-4fec-9e3a-4984745e7cd5',
    include_external_user_ids: [postOwnerId], // Uses Supabase UUID
    contents: { en: `${commenterName} commented on your post!` },
    headings: { en: 'New Comment 💬' },
    data: { type: 'comment', postId: postId }
  })
});
```

---

## Step 3: Update `supabase/config.toml`

Add configuration for the new Edge Function:

```toml
[functions.comment-notification]
verify_jwt = false
```

This allows the database webhook to call the function without authentication (webhook calls come from Supabase infrastructure, not user browsers).

---

## Step 4: Create Database Webhook (SQL Migration)

Create a database trigger and function to call the Edge Function when a comment is inserted:

```sql
-- Create function to invoke edge function
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call edge function via pg_net (async HTTP)
  PERFORM net.http_post(
    url := 'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/comment-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'post_comments',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_comment_inserted
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();
```

**Note**: This approach uses `pg_net` extension for async HTTP calls. Alternatively, Supabase Database Webhooks can be configured via the Dashboard.

---

## Step 5: Add OneSignal Identity Linking on Login (Optional Enhancement)

Currently, `OneSignal.login(user.id)` is only called when users enable notifications via the prompt. For better reliability, also call it on every auth state change:

**File: `src/hooks/useAuth.tsx`**

Add to the `onAuthStateChange` callback (inside the deferred setTimeout):

```typescript
// After profile fetch, ensure OneSignal identity is linked
if (window.OneSignalDeferred && session?.user) {
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.login(session.user.id);
      console.log('OneSignal identity linked on auth');
    } catch (e) {
      console.log('OneSignal login skipped (not initialized or declined)');
    }
  });
}
```

This ensures returning users are automatically re-linked to their OneSignal identity.

---

## Summary of Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/comment-notification/index.ts` | Create | Edge function to send push notifications |
| `supabase/config.toml` | Modify | Add `[functions.comment-notification]` config |
| `src/hooks/useAuth.tsx` | Modify | Add `OneSignal.login()` on auth state change |
| Database Migration | Create | Add trigger for `post_comments` INSERT events |

---

## Required Secrets

| Secret Name | Source | Purpose |
|-------------|--------|---------|
| `ONESIGNAL_REST_API_KEY` | OneSignal Dashboard | Authenticate REST API calls to send notifications |

---

## Testing Plan

1. **Add the secret**: Add `ONESIGNAL_REST_API_KEY` via Supabase Dashboard
2. **Deploy Edge Function**: Function deploys automatically
3. **Run migration**: Create the database trigger
4. **Test flow**:
   - User A creates a post
   - User B comments on User A's post
   - User A receives push notification
   - User A sees notification in the in-app notifications list

---

## Expected Notification Format

**Push Notification**:
- Title: "New Comment 💬"
- Body: "[Commenter Name] commented on your post!"
- Data: `{ type: 'comment', postId: '...' }`

**In-App Notification** (in notifications table):
- Type: `comment`
- Title: "New Comment"
- Body: "[Commenter Name] commented on your post!"
- Data: `{ postId: '...', commentId: '...' }`

