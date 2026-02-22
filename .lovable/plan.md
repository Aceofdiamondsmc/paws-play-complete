

## Fix Plan: Message Read Status, Dropdown Menu, and Push Notifications

### Issue 1: Unread Badge Not Clearing After Reading Messages

**Root Cause:** The RLS (Row-Level Security) policies on the `messages` table only allow updates where `sender_id = auth.uid()`. When you open a conversation, the app tries to set `read_at` on messages sent by the *other* person, but RLS blocks this because you're not the sender. The update silently fails, so the unread count never goes down.

**Fix:** Add a new RLS policy that allows conversation participants to update `read_at` on messages in their conversations (not just their own messages).

**SQL Migration:**
```sql
CREATE POLICY "Participants can mark messages as read"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );
```

Additionally, the `ChatView` component should call `refresh` on the message list when the user goes back, so the conversation list reflects the updated read status. The `onBack` callback in `Me.tsx` will be updated to also trigger a conversations refresh.

---

### Issue 2: Three-Dot Menu Not Working

**Root Cause:** The `DropdownMenuItem` in `ChatView.tsx` has an indentation issue where `onClick` appears on a separate line from the opening tag attributes, but more critically, the `ChatView` renders at `z-[60]` and the `DropdownMenuContent` may render inside the fixed container. The `onClick` handler itself is syntactically fine, but I'll clean up the JSX formatting to ensure proper attribute binding and test reliability.

**Fix:** Clean up the JSX so `onClick` is properly on the `DropdownMenuItem` opening tag (same line as other attributes), ensuring no rendering issues.

---

### Issue 3: No Push Notifications for New Messages

**Root Cause:** There is no edge function or database trigger to send push notifications when a new message is received. Likes, comments, and friend requests all have dedicated notification edge functions, but messages do not.

**Fix:** Create a new `message-notification` edge function and a database trigger on the `messages` table.

The edge function will:
1. Receive the new message INSERT event
2. Look up the conversation to find the recipient
3. Skip if sender = recipient (shouldn't happen, but safety check)
4. Insert an in-app notification into the `notifications` table
5. Send a push notification via OneSignal REST API to the recipient

The database trigger will fire `AFTER INSERT` on `messages` and invoke the edge function via `pg_net`.

---

### Technical Details

**Files to create:**
- `supabase/functions/message-notification/index.ts` -- New edge function

**Files to modify:**
- `src/components/profile/ChatView.tsx` -- Fix DropdownMenuItem formatting
- `src/pages/Me.tsx` -- Refresh conversations list on chat back navigation

**Database changes:**
1. New RLS policy on `messages` for participant updates
2. New trigger `on_message_insert_notify` on `messages` table
3. Add `message-notification` to `supabase/config.toml` with `verify_jwt = false`

