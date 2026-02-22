

## Simplify Message Send and Delete to Standard DB Operations Only

### Problem
The `realtime.send` error is blocking all chat actions. While there are no explicit `channel.send()` calls, the extra database operations after the primary write (updating `conversations.last_message_at`, deleting messages before conversations) may be triggering cascading realtime errors that freeze the UI.

### Changes

#### 1. `src/hooks/useMessages.tsx` -- Simplify `sendMessage`

Remove the follow-up `conversations.update()` call. The function should ONLY insert into `public.messages`:

```typescript
const sendMessage = async (content: string) => {
  if (!user || !conversationId) return { error: new Error('Not ready') };

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content
  });

  return { error };
};
```

The `last_message_at` update can be handled later via a database trigger if needed, keeping the client-side code minimal and non-blocking.

#### 2. `src/hooks/useMessages.tsx` -- Simplify `deleteConversation`

Replace the two-step delete with a single `conversations` delete. If the database has no cascade constraint, the messages will remain orphaned but the conversation will be removed from the UI. (A cascade constraint or cleanup trigger can be added later.)

```typescript
const deleteConversation = async () => {
  if (!conversationId) return { error: new Error('No conversation') };
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    if (error) console.error('Error deleting conversation:', error);
    return { error };
  } catch (err: any) {
    console.error('deleteConversation exception:', err);
    return { error: err };
  }
};
```

#### 3. No changes to `ChatView.tsx`

The try/catch error handling and toast feedback already in place are correct and stay as-is.

#### 4. No changes to Realtime subscriptions

The existing `postgres_changes` listeners remain -- they passively listen for database changes and update the UI. They do not send anything.

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useMessages.tsx` | Remove `conversations.update()` from `sendMessage`; simplify `deleteConversation` to single conversation delete |

